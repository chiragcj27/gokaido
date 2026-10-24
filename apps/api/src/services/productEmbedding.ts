import { createHash } from "node:crypto";
import { Product, mongoose } from "@gokaido/database";
import { createEmbeddings, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./openai.js";
import { invalidateVectorIndex } from "./productSearch.js";

// One embedding per product (not per SKU): size carries no meaning to search
// on, and colour is matched as a filter. The text is everything a shopper
// might describe the product by, as labelled lines so the model sees which
// word is the sport vs. the category vs. a colour.

const DESCRIPTION_MAX_CHARS = 1500;
const BATCH_SIZE = 100;

type EmbeddableProduct = {
  _id: mongoose.Types.ObjectId;
  name: string;
  sport: string;
  category: string;
  subcategory?: string;
  productType: string;
  description?: string;
  tags?: string[];
  certifications?: string[];
  variants?: Array<{ color: string; isActive?: boolean }>;
  fabric?: string;
  benefit?: string;
  qualityFeatures?: string;
  ageGroup?: string;
  skillLevel?: string;
  soldAs?: string;
  materialAndPadding?: string;
  embeddingHash?: string;
};

const EMBEDDABLE_FIELDS =
  "name sport category subcategory productType description tags certifications variants.color variants.isActive " +
  "fabric benefit qualityFeatures ageGroup skillLevel soldAs materialAndPadding +embeddingHash";

const humanize = (slug: string) => slug.replace(/-/g, " ");

export function buildProductEmbeddingText(p: EmbeddableProduct): string {
  const colors = [...new Set((p.variants ?? []).filter((v) => v.isActive !== false).map((v) => v.color))];
  const lines: Array<[string, string | undefined]> = [
    ["Product", p.name],
    ["Sport", p.sport],
    ["Category", humanize(p.category)],
    ["Type", p.subcategory ? humanize(p.subcategory) : undefined],
    ["Kind", p.productType],
    ["Colours", colors.join(", ")],
    ["Tags", p.tags?.join(", ")],
    ["Age group", p.ageGroup],
    ["Skill level", p.skillLevel],
    ["Sold as", p.soldAs],
    ["Fabric", p.fabric],
    ["Material", p.materialAndPadding],
    ["Benefit", p.benefit],
    ["Features", p.qualityFeatures],
    ["Certifications", p.certifications?.join(", ")],
    ["Description", p.description?.slice(0, DESCRIPTION_MAX_CHARS)],
  ];
  return lines
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => `${k}: ${v!.trim()}`)
    .join("\n");
}

// Model + dimensions are part of the fingerprint so switching either
// re-embeds everything on the next backfill.
function fingerprint(text: string): string {
  return createHash("sha256").update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}\n${text}`).digest("hex");
}

/**
 * Re-embeds the given products where their searchable text changed. Never
 * throws — a failed embedding must not fail an admin save; the product just
 * keeps its old vector (or stays keyword-only) until the next save or
 * `pnpm --filter @gokaido/api search:backfill`.
 */
export async function refreshProductEmbeddings(
  ids: Array<mongoose.Types.ObjectId | string>
): Promise<{ updated: number; unchanged: number; failed: number }> {
  const result = { updated: 0, unchanged: 0, failed: 0 };
  if (ids.length === 0) return result;

  try {
    const products = (await Product.find({ _id: { $in: ids } })
      .select(EMBEDDABLE_FIELDS)
      .lean()) as unknown as EmbeddableProduct[];

    const stale = products
      .map((p) => {
        const text = buildProductEmbeddingText(p);
        return { id: p._id, text, hash: fingerprint(text), current: p.embeddingHash };
      })
      .filter((p) => {
        if (p.hash === p.current) result.unchanged++;
        return p.hash !== p.current;
      });

    for (let i = 0; i < stale.length; i += BATCH_SIZE) {
      const batch = stale.slice(i, i + BATCH_SIZE);
      try {
        const vectors = await createEmbeddings(batch.map((p) => p.text));
        if (!vectors) {
          result.failed += batch.length;
          continue;
        }
        await Product.bulkWrite(
          batch.map((p, j) => ({
            updateOne: {
              filter: { _id: p.id },
              update: { $set: { embedding: vectors[j], embeddingHash: p.hash } },
              // Admin saves bump updatedAt already; a background re-embed shouldn't.
              timestamps: false,
            },
          }))
        );
        result.updated += batch.length;
        invalidateVectorIndex();
      } catch (err) {
        console.error("[embeddings] batch failed:", err);
        result.failed += batch.length;
      }
    }
  } catch (err) {
    console.error("[embeddings] refresh failed:", err);
    result.failed += ids.length - result.updated - result.unchanged;
  }

  return result;
}
