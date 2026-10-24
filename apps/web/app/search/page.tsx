import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import Bestsellers from "../components/Bestsellers/Bestsellers";
import Pagination from "../components/Pagination/Pagination";
import ProductFAQ from "../components/ProductFAQ/ProductFAQ";
import { getStoreFaqs } from "../lib/homepage";
import type { ApiSearchMeta } from "../lib/pdp/apiTypes";
import { searchProducts, type SearchResults } from "../lib/search/searchProducts";
import RecordRecentSearch from "./RecordRecentSearch";

interface SearchPageProps {
  // `ai=0` → take the query literally, without filters the API would infer from it.
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; ai?: string | string[] }>;
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function readQuery(q: string | string[] | undefined) {
  return first(q)?.trim() ?? "";
}

function readPage(page: string | string[] | undefined) {
  const n = Number.parseInt(first(page) ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function searchHref(query: string, page: number, interpret = true) {
  const params = new URLSearchParams({ q: query });
  if (!interpret) params.set("ai", "0");
  if (page > 1) params.set("page", String(page));
  return `/search?${params}`;
}

const humanize = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Human labels for the filters the API read out of the query, in a stable order. */
function filterLabels(f: ApiSearchMeta["appliedFilters"]): string[] {
  const labels: string[] = [];
  if (f.sport) labels.push(humanize(f.sport));
  if (f.category && f.category !== f.sport) labels.push(humanize(f.category));
  if (f.subcategory) labels.push(humanize(f.subcategory));
  else if (f.productType) labels.push(f.productType === "uniform" ? "Uniforms" : "Equipment");
  if (f.color) labels.push(humanize(f.color));
  if (f.size) labels.push(`Size ${f.size}`);
  if (f.minPrice != null && f.maxPrice != null) labels.push(`${inr(f.minPrice)} – ${inr(f.maxPrice)}`);
  else if (f.maxPrice != null) labels.push(`Under ${inr(f.maxPrice)}`);
  else if (f.minPrice != null) labels.push(`Over ${inr(f.minPrice)}`);
  return labels;
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
  const interpret = first(params.ai) !== "0";

  const faqsPromise = getStoreFaqs();
  let results: SearchResults = { products: [], total: 0, page, totalPages: 0 };
  let failed = false;
  if (query) {
    try {
      results = await searchProducts(query, page, interpret);
    } catch {
      failed = true;
    }
  }

  // A stale or hand-edited ?page= past the end lands on the last real page instead of an empty grid.
  if (!failed && results.totalPages > 0 && page > results.totalPages) {
    redirect(searchHref(query, results.totalPages, interpret));
  }

  const faqs = await faqsPromise;
  const title = query ? `Results for “${query}”` : "Search";
  const summary = !query
    ? "Type something in the search bar to find products."
    : failed
      ? "Search is unavailable right now. Please try again in a moment."
      : results.total === 0
        ? "No products matched your search. Try a different or more general term."
        : `${results.total} ${results.total === 1 ? "product" : "products"} found${
            results.totalPages > 1 ? ` · Page ${page} of ${results.totalPages}` : ""
          }`;

  // What the AI search made of the query: the filters it applied (with a way
  // out if it guessed wrong), or that none matched and these are near misses.
  const labels = results.search ? filterLabels(results.search.appliedFilters) : [];
  const literalLink = (
    <Link href={searchHref(query, 1, false)} className="text-paper underline underline-offset-4">
      Search without filters
    </Link>
  );
  const subtitle =
    !failed && results.search?.relaxed ? (
      <>
        <p className="m-0">{summary}</p>
        <p className="m-0 mt-2 text-sm">No exact matches — showing the closest products instead.</p>
      </>
    ) : !failed && labels.length > 0 ? (
      <>
        <p className="m-0">{summary}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span>Showing:</span>
          {labels.map((label) => (
            <span key={label} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-paper">
              {label}
            </span>
          ))}
          <span aria-hidden="true">·</span>
          {literalLink}
        </div>
      </>
    ) : (
      summary
    );

  return (
    <main>
      <RecordRecentSearch query={query} />
      <Bestsellers
        layout="grid"
        title={title}
        compactTitle
        subtitle={subtitle}
        products={results.products}
        footer={
          <Pagination
            page={page}
            totalPages={results.totalPages}
            hrefFor={(p) => searchHref(query, p, interpret)}
          />
        }
      />
      {/* Same full-width FAQ wrapper as the Best Sellers page. */}
      <div className="px-6 lg:px-10">
        <ProductFAQ faqs={faqs} />
      </div>
    </main>
  );
}
