import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import Pagination from "../components/Pagination/Pagination";
import { type BlogPostSummary, formatBlogDate, getBlogPosts } from "../lib/blogs";
import { DUMMY_BLOG_POSTS } from "../lib/fallbacks";

export const metadata: Metadata = {
  title: "Blogs",
  description: "News, training guides and stories from Gokaido: martial arts gear for Karate, Boxing and Taekwondo since 1975.",
  alternates: { canonical: "/blogs" },
};

/** Page 1 = 1 featured + 3 highlights + 15 "Latest" rows, as in the design. Later pages are all list rows. */
const PAGE_SIZE = 19;

interface BlogsPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

function readPage(page: string | string[] | undefined) {
  const n = Number.parseInt((Array.isArray(page) ? page[0] : page) ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

const pageHref = (page: number) => (page > 1 ? `/blogs?page=${page}` : "/blogs");
const postHref = (post: BlogPostSummary) => `/blogs/${post.slug}`;

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
  const page = readPage((await searchParams).page);
  const fetched = await getBlogPosts(page, PAGE_SIZE);

  if (fetched.totalPages > 0 && page > fetched.totalPages) redirect(pageHref(fetched.totalPages));

  // Placeholders until a post is published in admin, or while the API is down (DUMMY_DATA.md).
  const { posts, totalPages } =
    fetched.posts.length > 0 ? fetched : { posts: DUMMY_BLOG_POSTS as BlogPostSummary[], totalPages: 1 };

  const isFirstPage = page === 1;
  const featured = isFirstPage ? posts[0] : undefined;
  const highlights = isFirstPage ? posts.slice(1, 4) : [];
  const latest = isFirstPage ? posts.slice(4) : posts;

  return (
    <main className="pb-16 pt-6 lg:pt-10">
      <h1 className="sr-only">Gokaido Blog</h1>

      {featured && (
        <div className="mx-auto max-w-384 px-4 lg:px-8">
          <FeaturedPost post={featured} />
        </div>
      )}

      <div className="mx-auto max-w-384 px-4 sm:px-8 lg:px-16">
        {highlights.length > 0 && (
          <ul className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-4 lg:mt-16">
            {highlights.map((post) => (
              <li key={post.slug}>
                <HighlightPost post={post} />
              </li>
            ))}
          </ul>
        )}

        {latest.length > 0 && (
          <section aria-labelledby="blog-latest" className="mt-12 lg:mt-16">
            <h2 id="blog-latest" className="mb-4 text-base font-medium lg:text-lg">
              Latest
            </h2>
            <ul>
              {latest.map((post) => (
                <li key={post.slug} className="border-t border-white/25">
                  <LatestPost post={post} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {totalPages > 1 && (
          <div className="bg-white/12 px-4 py-10 lg:py-14">
            <Pagination page={page} totalPages={totalPages} hrefFor={pageHref} />
          </div>
        )}
      </div>
    </main>
  );
}

function PostImage({ post, sizes, priority }: { post: BlogPostSummary; sizes: string; priority?: boolean }) {
  return post.image ? (
    <Image
      src={post.image}
      alt=""
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
    />
  ) : (
    <div className="absolute inset-0 bg-panel" />
  );
}

function FeaturedPost({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={postHref(post)}
      className="group relative block aspect-4/5 overflow-hidden bg-panel no-underline sm:aspect-video lg:aspect-[2.1/1]"
    >
      <PostImage post={post} sizes="(min-width: 1536px) 1536px, 100vw" priority />
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/25 to-transparent sm:bg-linear-to-tr sm:via-black/10" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-12">
        <time dateTime={post.publishedAt} className="text-xs text-paper/80">
          {formatBlogDate(post.publishedAt)}
        </time>
        <h2 className="mt-2 max-w-2xl text-2xl font-medium leading-tight text-paper sm:text-3xl lg:text-5xl">
          {post.title}
        </h2>
        <span className="mt-3 inline-block text-xs text-paper/80 transition-colors group-hover:text-gold">
          Read the Story ›
        </span>
      </div>
    </Link>
  );
}

function HighlightPost({ post }: { post: BlogPostSummary }) {
  return (
    <Link href={postHref(post)} className="group block text-paper no-underline">
      <div className="relative aspect-3/2 overflow-hidden bg-panel">
        <PostImage post={post} sizes="(min-width: 640px) 33vw, 100vw" />
      </div>
      <time dateTime={post.publishedAt} className="mt-3 block text-xs text-paper/70">
        {formatBlogDate(post.publishedAt)}
      </time>
      <h3 className="mt-1 text-base leading-snug transition-colors group-hover:text-gold lg:text-lg">{post.title}</h3>
    </Link>
  );
}

function LatestPost({ post }: { post: BlogPostSummary }) {
  return (
    <Link
      href={postHref(post)}
      className="group grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 py-4 text-paper no-underline sm:grid-cols-[23%_minmax(0,1fr)_10rem] sm:gap-6 lg:py-5"
    >
      <div className="relative aspect-3/2 overflow-hidden bg-panel">
        <PostImage post={post} sizes="(min-width: 640px) 23vw, 40vw" />
      </div>
      <div>
        <h3 className="text-sm leading-snug transition-colors group-hover:text-gold sm:max-w-md lg:text-lg">
          {post.title}
        </h3>
        <time dateTime={post.publishedAt} className="mt-2 block text-xs text-paper/70 sm:hidden">
          {formatBlogDate(post.publishedAt)}
        </time>
      </div>
      <time dateTime={post.publishedAt} className="hidden text-left text-xs text-paper/70 sm:block">
        {formatBlogDate(post.publishedAt)}
      </time>
    </Link>
  );
}
