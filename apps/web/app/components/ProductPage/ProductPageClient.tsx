"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductGallery from "../ProductGallery/ProductGallery";
import ProductInfo from "../ProductInfo/ProductInfo";
import SizeGuide from "../SizeGuide/SizeGuide";
import BuildYourKit from "../BuildYourKit/BuildYourKit";
import CustomerReviews from "../CustomerReviews/CustomerReviews";
import RelatedProducts from "../RelatedProducts/RelatedProducts";
import ProductFAQ from "../ProductFAQ/ProductFAQ";
import { useCart } from "../../lib/cartStore";
import { DEFAULT_SIZE_GUIDE } from "../../lib/pdp/defaults";
import type { PdpProduct } from "../../lib/pdp/types";

// Structured data must carry absolute URLs; the feed uses the same base (API SITE_URL).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export interface ProductPageClientProps {
  product: PdpProduct;
  /** Color slug from the route — null on the base product URL. */
  activeColorSlug: string | null;
  /** URL prefix the product lives under: "/products" for real products, "/sample-product" for the sample. */
  basePath?: string;
}

export default function ProductPageClient({
  product,
  activeColorSlug,
  basePath = "/products",
}: ProductPageClientProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const defaultColor = product.colors[0];
  const currentColorSlug = activeColorSlug ?? defaultColor.slug;
  const currentColor = product.colors.find((c) => c.slug === currentColorSlug) ?? defaultColor;

  const [size, setSize] = useState(product.sizes[0]);

  // ?size= is applied after mount rather than read via useSearchParams during render: that hook
  // would force the whole page client-side-rendered (or dynamic), defeating the cached server HTML.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("size");
    if (requested && product.sizes.includes(requested)) setSize(requested);
  }, [product.sizes]);

  const activeVariant = useMemo(
    () => product.variants.find((v) => v.colorSlug === currentColorSlug && v.size === size),
    [product.variants, currentColorSlug, size],
  );

  const sizeGuide = product.sizeGuide ?? DEFAULT_SIZE_GUIDE;

  // Only sizes this specific color actually has in stock are selectable from
  // the size guide's chart — a row can exist on the chart (it's shared by
  // the whole subcategory) without this particular product/color offering it.
  const availableSizes = useMemo(
    () =>
      product.variants.filter((v) => v.colorSlug === currentColorSlug && v.stock > 0).map((v) => v.size),
    [product.variants, currentColorSlug],
  );

  const buildPath = (colorSlug: string) =>
    colorSlug === defaultColor.slug ? `${basePath}/${product.slug}` : `${basePath}/${product.slug}/${colorSlug}`;

  const buildUrl = (colorSlug: string, nextSize: string) => `${buildPath(colorSlug)}?size=${encodeURIComponent(nextSize)}`;

  const handleColorChange = (colorSlug: string) => {
    // Not every color is offered in every size — if the current size doesn't exist in the new
    // color, fall back to that color's first in-stock size instead of leaving nothing selected.
    const inColor = product.variants.filter((v) => v.colorSlug === colorSlug);
    const nextSize = inColor.some((v) => v.size === size)
      ? size
      : (inColor.find((v) => v.stock > 0) ?? inColor[0])?.size ?? size;
    if (nextSize !== size) setSize(nextSize);

    // Preserve any other query params (utm etc.), overriding only size.
    const params = new URLSearchParams(window.location.search);
    params.set("size", nextSize);
    router.replace(`${buildPath(colorSlug)}?${params.toString()}`, { scroll: false });
  };

  const handleSizeChange = (nextSize: string) => {
    setSize(nextSize);
    const params = new URLSearchParams(window.location.search);
    params.set("size", nextSize);
    router.replace(`${buildPath(currentColorSlug)}?${params.toString()}`, { scroll: false });
  };

  const handleAddToBag = () => {
    if (!activeVariant) return;
    addItem({
      id: activeVariant.sku,
      productSlug: product.slug,
      name: product.name,
      category: product.breadcrumb[product.breadcrumb.length - 1]?.label ?? "",
      imageSrc: currentColor.images[0],
      size,
      color: currentColor.name,
      price: activeVariant.price,
    });
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: currentColor.images,
    brand: { "@type": "Brand", name: "Gokaido" },
    ...(product.reviewSummary.totalCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.reviewSummary.average,
        reviewCount: product.reviewSummary.totalCount,
      },
    }),
    offers: product.variants
      .filter((v) => v.colorSlug === currentColorSlug)
      .map((v) => ({
        "@type": "Offer",
        sku: v.sku,
        price: v.price,
        priceCurrency: "INR",
        availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: `${SITE_URL}${buildUrl(currentColorSlug, v.size)}`,
      })),
  };

  return (
    <main className="mx-auto flex max-w-360 flex-col gap-24 px-4 pt-8 pb-24 md:px-8 lg:px-12">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="flex flex-col gap-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-sans text-sm text-paper/50">
          {product.breadcrumb.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-2">
              {index > 0 && <span aria-hidden="true">›</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-paper">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-paper/80">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        <section className="grid grid-cols-1 gap-12 lg:gap-12">
          <ProductGallery
            productName={product.name}
            colors={product.colors}
            activeColorSlug={currentColorSlug}
            onColorChange={handleColorChange}
          />
          <ProductInfo
            name={product.name}
            description={product.description}
            price={activeVariant?.price ?? product.variants[0].price}
            mrp={activeVariant?.mrp ?? product.variants[0].mrp}
            sizes={product.sizes}
            activeSize={size}
            onSizeChange={handleSizeChange}
            accordion={product.accordion}
            sizeGuide={sizeGuide}
            availableSizes={availableSizes}
            onAddToBag={handleAddToBag}
          />
        </section>
      </div>

      {(product.protectionStats.length > 0 || product.protectionComparison !== null) && (
        <SizeGuide stats={product.protectionStats} comparison={product.protectionComparison} />
      )}
      {product.buildYourKit.length > 0 && <BuildYourKit items={product.buildYourKit} />}
      <CustomerReviews summary={product.reviewSummary} reviews={product.reviews} />
      {product.relatedProducts.length > 0 && <RelatedProducts products={product.relatedProducts} />}
      {product.faqs.length > 0 && <ProductFAQ faqs={product.faqs} />}
    </main>
  );
}
