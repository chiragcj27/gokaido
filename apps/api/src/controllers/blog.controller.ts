import type { Request, Response } from "express";
import { BlogPost, type IBlogPost } from "@gokaido/database";

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
