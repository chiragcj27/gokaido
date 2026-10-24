import { Category, Color, Product, Subcategory, mongoose } from "@gokaido/database";
import { chatJson, createEmbeddings, isOpenAIConfigured } from "./openai.js";
import { escapeRegex } from "../utils/regex.js";

// Hybrid product search: Atlas Search (keyword, typo-tolerant) and a vector
// (meaning) search each return a ranked list of ids, merged with reciprocal
// rank fusion. Longer / non-English / price-bearing queries are
// first run through a small LLM that pulls out hard filters ("under 1500",
// "red", "kids") — the part embeddings are bad at — and rewrites the rest into
// a short English query for the vector side.
//
// The cluster is on MongoDB 8.0, which has no $rankFusion stage (8.1+), so
// the fusion happens here rather than in one aggregation.
//
// Vector search runs in-process, not via Atlas $vectorSearch: the cluster is
// on a free tier capped at 3 search indexes and shared with another project
// that uses 2, so `product_text` takes the last slot. Brute-force cosine over
// every product is <1ms and <1MB at catalogue sizes into the low thousands.
// If the catalogue (or a dedicated cluster) ever makes $vectorSearch
// worthwhile, add a `vectorSearch` index on `embedding` (512 dims, cosine,
// filter on isActive) and swap vectorSearch() below for a $vectorSearch stage.

export const TEXT_SEARCH_INDEX = "product_text";

/** Atlas Search index on `products` — created by `pnpm --filter @gokaido/api search:indexes`. */
export const TEXT_SEARCH_INDEX_DEFINITION = {
  mappings: {
    dynamic: false,
    fields: {
      name: [
        { type: "string" },
        { type: "autocomplete", tokenization: "edgeGram", minGrams: 2, maxGrams: 15, foldDiacritics: true },
      ],
      description: { type: "string" },
      tags: { type: "string" },
      sport: { type: "string" },
      category: { type: "string" },
      subcategory: { type: "string" },
      isActive: { type: "boolean" },
      variants: { type: "document", fields: { color: { type: "string" }, sku: { type: "string" } } },
    },
  },
};

const CANDIDATES_PER_SIDE = 50;
const MAX_RESULTS = 100;
const RRF_K = 60;
// Nearest neighbours exist however far away they are — without a floor,
// gibberish queries "match" the whole catalogue. Cosine similarity; 0.36 is a
// starting guess for text-embedding-3-small: revisit with real queries once
// the catalogue is populated (too high → vague queries miss; too low → noise
// at the tail).
const MIN_COSINE_SIMILARITY = 0.36;
// How long a process reuses its in-memory copy of the product vectors. Saves
// in this process invalidate it immediately (see invalidateVectorIndex);
// saves elsewhere (another serverless instance) show up within this window.
const VECTOR_INDEX_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Small TTL caches. Per-process (so per serverless instance) — enough to stop
// repeated / trending queries paying for the same OpenAI call twice.

class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();
  constructor(private ttlMs: number, private maxEntries: number) {}
  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return hit.value;
  }
  set(key: string, value: V): void {
    if (this.store.size >= this.maxEntries) {
      this.store.delete(this.store.keys().next().value as string);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }
}

const HOUR = 60 * 60 * 1000;
const embeddingCache = new TtlCache<number[]>(24 * HOUR, 2000);
const interpretationCache = new TtlCache<SearchInterpretation | null>(24 * HOUR, 2000);
const taxonomyCache = new TtlCache<Taxonomy>(10 * 60 * 1000, 1);

// ---------------------------------------------------------------------------
// LLM query interpretation

export type SearchInterpretation = {
  sport: "karate" | "taekwondo" | "kickboxing" | "boxing" | "mma" | null;
  category: string | null;
  subcategory: string | null;
  productType: "uniform" | "equipment" | null;
  color: string | null;
  size: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  /** Short English description of the product wanted, filters stripped out. */
  semanticQuery: string;
};

type Taxonomy = {
  categories: Array<{ slug: string; name: string }>;
  subcategories: Array<{ slug: string; name: string }>;
  colors: string[];
};

async function getTaxonomy(): Promise<Taxonomy> {
  const cached = taxonomyCache.get("t");
  if (cached) return cached;
  const [categories, subcategories, colors] = await Promise.all([
    Category.find({ isActive: true }).select("slug name").lean(),
    Subcategory.find({ isActive: true }).select("slug name").lean(),
    Color.find().select("name").lean(),
  ]);
  const taxonomy: Taxonomy = {
    categories: categories.map((c) => ({ slug: c.slug, name: c.name })),
    subcategories: subcategories.map((s) => ({ slug: s.slug, name: s.name })),
    colors: colors.map((c) => c.name),
  };
  taxonomyCache.set("t", taxonomy);
  return taxonomy;
}

// Short Latin-script keyword queries ("red gi", "boxing gloves") are handled
// fine by hybrid search alone — skip the LLM call for them.
function needsInterpretation(q: string): boolean {
  return q.split(/\s+/).length >= 4 || /\d/.test(q) || /[^\x00-\x7F]/.test(q);
}

const nullable = (schema: Record<string, unknown>, values?: string[]) =>
  values
    ? { type: ["string", "null"], enum: [...values, null] }
    : { ...schema, type: [schema.type as string, "null"] };

async function interpretQuery(q: string): Promise<SearchInterpretation | null> {
  const key = q.toLowerCase();
  const cached = interpretationCache.get(key);
  if (cached !== undefined) return cached;

  const t = await getTaxonomy();
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["sport", "category", "subcategory", "productType", "color", "size", "minPrice", "maxPrice", "semanticQuery"],
    properties: {
      sport: nullable({}, ["karate", "taekwondo", "kickboxing", "boxing", "mma"]),
      category: t.categories.length ? nullable({}, t.categories.map((c) => c.slug)) : { type: "null" },
      subcategory: t.subcategories.length ? nullable({}, t.subcategories.map((s) => s.slug)) : { type: "null" },
      productType: nullable({}, ["uniform", "equipment"]),
      color: t.colors.length ? nullable({}, t.colors) : { type: "null" },
      size: nullable({ type: "string" }),
      minPrice: nullable({ type: "number" }),
      maxPrice: nullable({ type: "number" }),
      semanticQuery: { type: "string" },
    },
  };

  const system = [
    "You turn a shopper's search on Gokaido, an Indian martial-arts gear store, into search filters.",
    "The query may be English, Hindi, Marathi, Tamil, or a mix (Hinglish etc.).",
    "Set a filter ONLY when the shopper clearly states it; otherwise null. Never guess.",
    "Prices are in INR: 'under 1500' → maxPrice 1500, 'above 2k' → minPrice 2000.",
    "productType: 'uniform' for gi/dobok/uniform/clothing, 'equipment' for gloves/guards/pads/gear.",
    "semanticQuery: a short English phrase for the product itself (include who it's for, e.g. 'kids', 'beginner'), without price, colour or size words.",
    `Categories: ${t.categories.map((c) => `${c.slug} (${c.name})`).join(", ") || "none"}.`,
    `Subcategories: ${t.subcategories.map((s) => `${s.slug} (${s.name})`).join(", ") || "none"}.`,
  ].join("\n");

  let result: SearchInterpretation | null = null;
  try {
    result = await chatJson<SearchInterpretation>(system, q, "search_filters", schema);
  } catch (err) {
    console.error("[search] query interpretation failed:", err);
    return null; // not cached — transient failure
  }
  interpretationCache.set(key, result);
  return result;
}

async function embedQuery(text: string): Promise<number[] | null> {
  const key = text.toLowerCase();
  const cached = embeddingCache.get(key);
  if (cached) return cached;
  try {
    const [vector] = (await createEmbeddings([text])) ?? [];
    if (vector) embeddingCache.set(key, vector);
    return vector ?? null;
  } catch (err) {
    console.error("[search] query embedding failed:", err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Retrieval

type Id = mongoose.Types.ObjectId;

async function keywordSearch(q: string, isActive: boolean | undefined): Promise<Id[]> {
  try {
    const rows = await Product.aggregate<{ _id: Id }>([
      {
        $search: {
          index: TEXT_SEARCH_INDEX,
          compound: {
            should: [
              { text: { query: q, path: "name", fuzzy: { maxEdits: 1 }, score: { boost: { value: 3 } } } },
              {
                text: {
                  query: q,
                  path: ["tags", "sport", "category", "subcategory", "variants.color", "variants.sku"],
                  fuzzy: { maxEdits: 1 },
                },
              },
              { text: { query: q, path: "description" } },
            ],
            minimumShouldMatch: 1,
            ...(isActive !== undefined && { filter: [{ equals: { path: "isActive", value: isActive } }] }),
          },
        },
      },
      { $limit: CANDIDATES_PER_SIDE },
      { $project: { _id: 1 } },
    ]);
    return rows.map((r) => r._id);
  } catch (err) {
    // Atlas Search index missing (e.g. a fresh cluster before search:indexes ran)
    // — fall back to the plain $text index so search still works.
    console.error("[search] $search failed, falling back to $text:", (err as Error).message);
    const rows = await Product.find(
      { $text: { $search: q }, ...(isActive !== undefined && { isActive }) },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(CANDIDATES_PER_SIDE)
      .select("_id")
      .lean();
    return rows.map((r) => r._id as Id);
  }
}

type VectorIndex = { ids: Id[]; active: boolean[]; vectors: Float32Array[]; loadedAt: number };
let vectorIndex: Promise<VectorIndex> | null = null;

async function loadVectorIndex(): Promise<VectorIndex> {
  const rows = (await Product.find({ embedding: { $exists: true } })
    .select("+embedding isActive")
    .lean()) as unknown as Array<{ _id: Id; isActive: boolean; embedding: number[] }>;
  return {
    ids: rows.map((r) => r._id),
    active: rows.map((r) => r.isActive),
    vectors: rows.map((r) => Float32Array.from(r.embedding)),
    loadedAt: Date.now(),
  };
}

function getVectorIndex(): Promise<VectorIndex> {
  if (!vectorIndex) {
    vectorIndex = loadVectorIndex().catch((err) => {
      vectorIndex = null;
      throw err;
    });
  }
  return vectorIndex.then((index) => {
    if (Date.now() - index.loadedAt > VECTOR_INDEX_TTL_MS) vectorIndex = null;
    return index;
  });
}

/** Called after product embeddings change so this process re-reads them. */
export function invalidateVectorIndex(): void {
  vectorIndex = null;
}

async function vectorSearch(text: string, isActive: boolean | undefined): Promise<Id[]> {
  const queryVector = await embedQuery(text);
  if (!queryVector) return [];
  try {
    const index = await getVectorIndex();
    const scored: Array<{ id: Id; score: number }> = [];
    for (let i = 0; i < index.ids.length; i++) {
      if (isActive !== undefined && index.active[i] !== isActive) continue;
      // OpenAI embeddings are unit-length, so the dot product is the cosine.
      const v = index.vectors[i]!;
      let dot = 0;
      for (let d = 0; d < v.length; d++) dot += v[d]! * queryVector[d]!;
      if (dot >= MIN_COSINE_SIMILARITY) scored.push({ id: index.ids[i]!, score: dot });
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, CANDIDATES_PER_SIDE)
      .map((s) => s.id);
  } catch (err) {
    console.error("[search] vector search failed:", (err as Error).message);
    return [];
  }
}

function reciprocalRankFusion(...lists: Id[][]): Id[] {
  const scores = new Map<string, { id: Id; score: number }>();
  for (const list of lists) {
    list.forEach((id, rank) => {
      const key = id.toString();
      const entry = scores.get(key) ?? { id, score: 0 };
      entry.score += 1 / (RRF_K + rank + 1);
      scores.set(key, entry);
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS)
    .map((e) => e.id);
}

/**
 * Ranked product ids for a free-text query (best first, at most 100), plus
 * the LLM's reading of it when one ran. Filters in `interpretation` are NOT
 * applied here — the caller merges them with explicit query params, so a
 * filter the shopper set in the UI always wins over an inferred one.
 */
export async function searchProductIds(
  q: string,
  isActive: boolean | undefined,
  { interpret = true }: { interpret?: boolean } = {}
): Promise<{ ids: Id[]; interpretation: SearchInterpretation | null }> {
  const interpretation =
    interpret && isOpenAIConfigured() && needsInterpretation(q) ? await interpretQuery(q) : null;
  const semanticText = interpretation?.semanticQuery || q;
  // Keyword-match the English rewrite when the shopper typed in another
  // script — the catalogue text is English, so the original can't match.
  const keywordText = /[^\x00-\x7F]/.test(q) && interpretation ? semanticText : q;

  const [keywordIds, vectorIds] = await Promise.all([
    keywordSearch(keywordText, isActive),
    vectorSearch(semanticText, isActive),
  ]);
  return { ids: reciprocalRankFusion(keywordIds, vectorIds), interpretation };
}

// ---------------------------------------------------------------------------
// Autocomplete (search-as-you-type). Keyword-only on purpose: it fires on
// every pause in typing, so it must stay free (no OpenAI) and fast.

export type ProductSuggestion = { name: string; slug: string; cardImage?: string; minPrice?: number };

const SUGGEST_LIMIT = 6;
const SUGGEST_PROJECTION = { _id: 0, name: 1, slug: 1, cardImage: 1, minPrice: { $min: "$variants.basePrice" } };

export async function suggestProducts(q: string): Promise<ProductSuggestion[]> {
  try {
    return await Product.aggregate<ProductSuggestion>([
      {
        $search: {
          index: TEXT_SEARCH_INDEX,
          compound: {
            should: [
              { autocomplete: { query: q, path: "name", score: { boost: { value: 2 } } } },
              { autocomplete: { query: q, path: "name", fuzzy: { maxEdits: 1, prefixLength: 1 } } },
            ],
            minimumShouldMatch: 1,
            filter: [{ equals: { path: "isActive", value: true } }],
          },
        },
      },
      { $limit: SUGGEST_LIMIT },
      { $project: SUGGEST_PROJECTION },
    ]);
  } catch (err) {
    // Atlas Search index missing — plain substring match on the name.
    console.error("[search] autocomplete $search failed, falling back to regex:", (err as Error).message);
    return Product.aggregate<ProductSuggestion>([
      { $match: { isActive: true, name: { $regex: escapeRegex(q), $options: "i" } } },
      { $limit: SUGGEST_LIMIT },
      { $project: SUGGEST_PROJECTION },
    ]);
  }
}
