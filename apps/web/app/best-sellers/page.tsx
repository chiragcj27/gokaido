import type { Metadata } from "next";
import Bestsellers from "../components/Bestsellers/Bestsellers";
import ProductFAQ from "../components/ProductFAQ/ProductFAQ";
import { DEFAULT_FAQS } from "../lib/pdp/defaults";

export const metadata: Metadata = {
  title: "Best Sellers",
};

// Dummy bestsellers until this is backed by real product data — same
// placeholder as the homepage row, extended to the three rows in the design.
const DUMMY_BESTSELLERS = Array.from({ length: 12 }, (_, i) => ({
  slug: `dummy-bestseller-${i + 1}`,
  title: "Lorem ipsum",
  subtitle: "Lorem ipsum",
  badge: "100% Cotton",
  imageSrc: "/card/card-sample.png",
  price: 2499,
  mrp: 3499,
}));

export default function BestSellersPage() {
  return (
    <main>
      <Bestsellers layout="grid" products={DUMMY_BESTSELLERS} />
      {/* ProductFAQ bleeds out with negative margins sized for the product page's
          padding — this wrapper supplies that padding so it lands full-width. */}
      <div className="px-6 lg:px-10">
        <ProductFAQ faqs={DEFAULT_FAQS} />
      </div>
    </main>
  );
}
