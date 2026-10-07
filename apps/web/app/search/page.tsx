import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Bestsellers from "../components/Bestsellers/Bestsellers";
import Pagination from "../components/Pagination/Pagination";
import ProductFAQ from "../components/ProductFAQ/ProductFAQ";
import { DEFAULT_FAQS } from "../lib/pdp/defaults";
import { searchProducts, type SearchResults } from "../lib/search/searchProducts";

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function readQuery(q: string | string[] | undefined) {
  return first(q)?.trim() ?? "";
}

function readPage(page: string | string[] | undefined) {
  const n = Number.parseInt(first(page) ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function searchHref(query: string, page: number) {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = readQuery(params.q);
  const page = readPage(params.page);
  return {
    title: query
      ? `Search results for "${query}"${page > 1 ? ` – Page ${page}` : ""}`
      : "Search",
    // Internal search result pages are thin/duplicate content — keep them out of the index.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = readQuery(params.q);
  const page = readPage(params.page);

  let results: SearchResults = { products: [], total: 0, page, totalPages: 0 };
  let failed = false;
  if (query) {
    try {
      results = await searchProducts(query, page);
    } catch {
      failed = true;
    }
  }

  // A stale or hand-edited ?page= past the end lands on the last real page instead of an empty grid.
  if (!failed && results.totalPages > 0 && page > results.totalPages) {
    redirect(searchHref(query, results.totalPages));
  }

  const title = query ? `Results for “${query}”` : "Search";
  const subtitle = !query
    ? "Type something in the search bar to find products."
    : failed
      ? "Search is unavailable right now. Please try again in a moment."
      : results.total === 0
        ? "No products matched your search. Try a different or more general term."
        : `${results.total} ${results.total === 1 ? "product" : "products"} found${
            results.totalPages > 1 ? ` · Page ${page} of ${results.totalPages}` : ""
          }`;

  return (
    <main>
      <Bestsellers
        layout="grid"
        title={title}
        subtitle={subtitle}
        products={results.products}
        footer={
          <Pagination
            page={page}
            totalPages={results.totalPages}
            hrefFor={(p) => searchHref(query, p)}
          />
        }
      />
      {/* Same full-width FAQ wrapper as the Best Sellers page. */}
      <div className="px-6 lg:px-10">
        <ProductFAQ faqs={DEFAULT_FAQS} />
      </div>
    </main>
  );
}
