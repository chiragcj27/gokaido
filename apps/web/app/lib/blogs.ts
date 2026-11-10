import { ApiError, apiGet } from "./pdp/api";

export interface BlogPostSummary {
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  author: string;
  tags: string[];
  publishedAt: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface BlogPostPage {
  posts: BlogPostSummary[];
  totalPages: number;
}

interface ApiBlogPost {
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  author: string;
  tags: string[];
  publishedAt: string;
  content?: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

const toSummary = (p: ApiBlogPost): BlogPostSummary => ({
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  image: p.featuredImage,
  author: p.author,
  tags: p.tags ?? [],
  publishedAt: p.publishedAt,
});

// 5 min cache, tagged "blog-posts". Empty page on failure, so the caller falls
// back to the dummy posts (lib/fallbacks.ts).
export async function getBlogPosts(page: number, limit: number): Promise<BlogPostPage> {
  try {
    const res = await apiGet<{ posts: ApiBlogPost[]; totalPages: number }>(
      `/blog-posts?page=${page}&limit=${limit}`,
      { revalidate: 300, tags: ["blog-posts"] },
    );
    return { posts: (res.posts ?? []).map(toSummary), totalPages: res.totalPages ?? 0 };
  } catch {
    return { posts: [], totalPages: 0 };
  }
}

/** `null` when the post doesn't exist (or isn't published); throws only on a non-404 API failure. */
export async function getBlogPost(slug: string): Promise<BlogPostDetail | null> {
  try {
    const { post } = await apiGet<{ post: ApiBlogPost }>(`/blog-posts/${encodeURIComponent(slug)}`, {
      revalidate: 300,
      tags: ["blog-posts", `blog-post:${slug}`],
    });
    return {
      ...toSummary(post),
      content: post.content ?? "",
      metaTitle: post.metaTitle ?? null,
      metaDescription: post.metaDescription ?? null,
    };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** "September 17, 2026" — the design's date format, on the IST calendar day. */
export function formatBlogDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
