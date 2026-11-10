import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { type BlogPostDetail, formatBlogDate, getBlogPost, getBlogPosts } from "../../lib/blogs";
import { DUMMY_BLOG_POSTS } from "../../lib/fallbacks";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// Real post first; the dummy posts only resolve while no real post is published
// (so their links from the placeholder /blogs list work, and vanish with it).
const loadPost = cache(async (slug: string): Promise<BlogPostDetail | null> => {
  const post = await getBlogPost(slug).catch(() => null);
  if (post) return post;
  const { posts } = await getBlogPosts(1, 1);
  if (posts.length > 0) return null;
  return DUMMY_BLOG_POSTS.find((p) => p.slug === slug) ?? null;
});

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await loadPost((await params).slug);
  if (!post) return { title: "Blog post not found" };
  const description = post.metaDescription ?? post.excerpt ?? undefined;
  return {
    title: post.metaTitle ?? post.title,
    description,
    alternates: { canonical: `/blogs/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.metaTitle ?? post.title,
      description,
      publishedTime: post.publishedAt,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await loadPost((await params).slug);
  if (!post) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const absolute = (path: string) => (path.startsWith("http") ? path : `${siteUrl}${path}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "Gokaido" },
    image: post.image ? [absolute(post.image)] : undefined,
    mainEntityOfPage: absolute(`/blogs/${post.slug}`),
  };

  // Content is stored as plain text; blank lines separate paragraphs.
  const paragraphs = post.content.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  return (
    <main className="pb-16 pt-6 lg:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <article>
        <header className="mx-auto max-w-3xl px-4 sm:px-8">
          <Link href="/blogs" className="text-xs text-paper/70 no-underline transition-colors hover:text-gold">
            ‹ All posts
          </Link>
          <time dateTime={post.publishedAt} className="mt-6 block text-xs text-paper/70">
            {formatBlogDate(post.publishedAt)}
          </time>
          <h1 className="mt-2 text-3xl font-medium leading-tight lg:text-5xl">{post.title}</h1>
          <p className="mt-3 text-sm text-paper/70">By {post.author}</p>
        </header>

        {post.image && (
          <div className="mx-auto mt-8 max-w-384 px-4 lg:mt-12 lg:px-8">
            <div className="relative aspect-video overflow-hidden bg-panel lg:aspect-[2.1/1]">
              <Image src={post.image} alt="" fill priority sizes="(min-width: 1536px) 1536px, 100vw" className="object-cover" />
            </div>
          </div>
        )}

        <div className="mx-auto mt-8 max-w-3xl space-y-5 px-4 text-base leading-relaxed text-paper/90 sm:px-8 lg:mt-12 lg:text-lg">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>

        {post.tags.length > 0 && (
          <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-2 px-4 sm:px-8">
            {post.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-white/20 px-3 py-1 text-xs text-paper/80">
                {tag}
              </li>
            ))}
          </ul>
        )}
      </article>
    </main>
  );
}
