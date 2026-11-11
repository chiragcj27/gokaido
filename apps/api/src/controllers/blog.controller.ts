import type { Request, Response } from "express";
import { BlogPost, mongoose, type IBlogPost } from "@gokaido/database";
import { createBlogPostSchema, updateBlogPostSchema } from "../schemas/blog.schema.js";
import { sanitizeBlogHtml } from "../utils/sanitizeBlogHtml.js";

const LANGUAGES = ["en", "hi", "mr", "ta"] as const;
const MAX_LIMIT = 50;

type LocalizedMap = Map<string, string> | Record<string, string> | undefined;

/** Picks the requested language from a multilingual field, falling back to English. */
function pick(field: LocalizedMap, lang: string): string | undefined {
  if (!field) return undefined;
  const get = (k: string) => (field instanceof Map ? field.get(k) : field[k]);
  return get(lang) || get("en") || undefined;
}

function readLang(raw: unknown): string {
  return typeof raw === "string" && (LANGUAGES as readonly string[]).includes(raw) ? raw : "en";
}

function readInt(raw: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number.parseInt(typeof raw === "string" ? raw : "", 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : fallback;
}

const published = () => ({ isPublished: true, publishedAt: { $lte: new Date() } });

// Public — storefront /blogs. Newest first; `content` is left out of the list.
export async function listPublicBlogPosts(req: Request, res: Response): Promise<void> {
  const lang = readLang(req.query.lang);
  const page = readInt(req.query.page, 1);
  const limit = readInt(req.query.limit, 20, MAX_LIMIT);

  const filter = published();
  const [docs, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug excerpt featuredImage author tags sport publishedAt")
      .lean<IBlogPost[]>(),
    BlogPost.countDocuments(filter),
  ]);

  res.json({
    posts: docs.map((p) => ({
      slug: p.slug,
      title: pick(p.title, lang) ?? p.slug,
      excerpt: pick(p.excerpt, lang) ?? null,
      featuredImage: p.featuredImage ?? null,
      author: p.author,
      tags: p.tags ?? [],
      sport: p.sport ?? null,
      publishedAt: p.publishedAt,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// Public — storefront /blogs/{slug}. Unpublished or scheduled posts 404.
export async function getPublicBlogPost(req: Request, res: Response): Promise<void> {
  const lang = readLang(req.query.lang);
  const post = await BlogPost.findOne({ slug: String(req.params.slug).toLowerCase(), ...published() }).lean<IBlogPost>();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  res.json({
    post: {
      slug: post.slug,
      title: pick(post.title, lang) ?? post.slug,
      excerpt: pick(post.excerpt, lang) ?? null,
      content: pick(post.content, lang) ?? "",
      metaTitle: pick(post.metaTitle, lang) ?? null,
      metaDescription: pick(post.metaDescription, lang) ?? null,
      featuredImage: post.featuredImage ?? null,
      author: post.author,
      tags: post.tags ?? [],
      sport: post.sport ?? null,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt,
    },
  });
}

// ── Admin ────────────────────────────────────────────────────────────────────

type Localized = Partial<Record<(typeof LANGUAGES)[number], string>>;

/** Drops blank languages so the storefront's English fallback kicks in for them. */
function compact(value: Localized | undefined, clean: (s: string) => string = (s) => s): Record<string, string> {
  const out: Record<string, string> = {};
  for (const lang of LANGUAGES) {
    const v = value?.[lang];
    if (v === undefined) continue;
    const cleaned = clean(v);
    if (cleaned) out[lang] = cleaned;
  }
  return out;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

// GET /api/blog-posts/admin — every post incl. drafts; content left out of the list.
export async function listAdminBlogPosts(req: Request, res: Response): Promise<void> {
  const page = readInt(req.query.page, 1);
  const limit = readInt(req.query.limit, 25, 100);
  const filter: Record<string, unknown> = {};

  const status = req.query.status;
  if (status === "draft") filter.isPublished = false;
  else if (status === "published") Object.assign(filter, published());
  else if (status === "scheduled") Object.assign(filter, { isPublished: true, publishedAt: { $gt: new Date() } });

  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ "title.en": rx }, { slug: rx }, { author: rx }];
  }

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select("title slug featuredImage author tags isPublished publishedAt updatedAt")
      .lean(),
    BlogPost.countDocuments(filter),
  ]);
  res.json({ posts, page, limit, total, totalPages: Math.ceil(total / limit) });
}

// GET /api/blog-posts/admin/:id — full post for the editor.
export async function getAdminBlogPost(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const post = await BlogPost.findById(req.params.id).lean();
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json({ post });
}

export async function createBlogPost(req: Request, res: Response): Promise<void> {
  const parsed = createBlogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid post" });
    return;
  }
  const d = parsed.data;

  const content = compact(d.content, sanitizeBlogHtml);
  if (!content.en) {
    res.status(400).json({ error: "Content (English) is empty after removing unsupported markup" });
    return;
  }

  const publishedAt = d.publishedAt instanceof Date ? d.publishedAt : d.isPublished ? new Date() : undefined;

  try {
    const post = await BlogPost.create({
      slug: d.slug,
      title: compact(d.title),
      content,
      excerpt: compact(d.excerpt),
      metaTitle: compact(d.metaTitle),
      metaDescription: compact(d.metaDescription),
      ...(d.featuredImage && { featuredImage: d.featuredImage }),
      author: d.author,
      tags: d.tags ?? [],
      ...(d.sport && { sport: d.sport }),
      isPublished: d.isPublished ?? false,
      ...(publishedAt && { publishedAt }),
      createdBy: req.user!.id,
    });
    res.status(201).json({ post });
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: "Another post already uses this slug" });
      return;
    }
    throw err;
  }
}

export async function updateBlogPost(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const parsed = updateBlogPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid post" });
    return;
  }
  const d = parsed.data;

  const existing = await BlogPost.findById(req.params.id).select("publishedAt").lean<Pick<IBlogPost, "publishedAt">>();
  if (!existing) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};

  // Localized fields are replaced wholesale — the form always sends every language.
  if (d.slug !== undefined) set.slug = d.slug;
  if (d.title !== undefined) set.title = compact(d.title);
  if (d.content !== undefined) {
    const content = compact(d.content, sanitizeBlogHtml);
    if (!content.en) {
      res.status(400).json({ error: "Content (English) is empty after removing unsupported markup" });
      return;
    }
    set.content = content;
  }
  if (d.excerpt !== undefined) set.excerpt = compact(d.excerpt);
  if (d.metaTitle !== undefined) set.metaTitle = compact(d.metaTitle);
  if (d.metaDescription !== undefined) set.metaDescription = compact(d.metaDescription);
  if (d.featuredImage !== undefined) {
    if (d.featuredImage) set.featuredImage = d.featuredImage;
    else unset.featuredImage = "";
  }
  if (d.author !== undefined) set.author = d.author;
  if (d.tags !== undefined) set.tags = d.tags;
  if (d.sport !== undefined) {
    if (d.sport) set.sport = d.sport;
    else unset.sport = "";
  }
  if (d.isPublished !== undefined) set.isPublished = d.isPublished;

  if (d.publishedAt instanceof Date) set.publishedAt = d.publishedAt;
  else if (d.publishedAt === "" || d.publishedAt === null) unset.publishedAt = "";
  // First publish with no date given → publish now.
  const willBePublished = d.isPublished === true;
  const hasDate = set.publishedAt !== undefined || (existing.publishedAt && unset.publishedAt === undefined);
  if (willBePublished && !hasDate) {
    set.publishedAt = new Date();
    delete unset.publishedAt;
  }

  try {
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      { ...(Object.keys(set).length > 0 && { $set: set }), ...(Object.keys(unset).length > 0 && { $unset: unset }) },
      { new: true, runValidators: true },
    );
    res.json({ post });
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: "Another post already uses this slug" });
      return;
    }
    throw err;
  }
}

export async function deleteBlogPost(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid post id" });
    return;
  }
  const post = await BlogPost.findByIdAndDelete(req.params.id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  res.json({ ok: true });
}
