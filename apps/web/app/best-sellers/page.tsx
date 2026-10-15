import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Bestsellers from "../components/Bestsellers/Bestsellers";
import Pagination from "../components/Pagination/Pagination";
import ProductFAQ from "../components/ProductFAQ/ProductFAQ";
import { getBestsellers } from "../lib/catalog";
import { getStoreFaqs } from "../lib/homepage";

export const metadata: Metadata = {
  title: "Best Sellers",
};

/** Multiple of 4 so every full page fills the grid's four-column rows. */
const PAGE_SIZE = 24;

interface BestSellersPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

function readPage(page: string | string[] | undefined) {
  const n = Number.parseInt((Array.isArray(page) ? page[0] : page) ?? "", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

const pageHref = (page: number) => (page > 1 ? `/best-sellers?page=${page}` : "/best-sellers");

export default async function BestSellersPage({ searchParams }: BestSellersPageProps) {
  const page = readPage((await searchParams).page);
  // Products flagged "bestseller" in admin; placeholders until some are.
  const [results, faqs] = await Promise.all([getBestsellers(PAGE_SIZE, page), getStoreFaqs()]);

  if (results.totalPages > 0 && page > results.totalPages) redirect(pageHref(results.totalPages));

  return (
    <main>
      <Bestsellers
        layout="grid"
        products={results.products}
        footer={<Pagination page={page} totalPages={results.totalPages} hrefFor={pageHref} />}
      />
      {/* ProductFAQ bleeds out with negative margins sized for the product page's
          padding — this wrapper supplies that padding so it lands full-width. */}
      <div className="px-6 lg:px-10">
        <ProductFAQ faqs={faqs} />
      </div>
    </main>
  );
}
