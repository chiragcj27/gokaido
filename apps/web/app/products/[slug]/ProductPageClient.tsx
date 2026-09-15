"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProductGallery from "../../components/ProductGallery/ProductGallery";
import ProductInfo from "../../components/ProductInfo/ProductInfo";
import SizeGuide from "../../components/SizeGuide/SizeGuide";
import BuildYourKit from "../../components/BuildYourKit/BuildYourKit";
import CustomerReviews from "../../components/CustomerReviews/CustomerReviews";
import RelatedProducts from "../../components/RelatedProducts/RelatedProducts";
import ProductFAQ from "../../components/ProductFAQ/ProductFAQ";
import type { DummyProduct } from "../../lib/dummyProduct";

export interface ProductPageClientProps {
  product: DummyProduct;
  /** Color slug from the route — null on the base /products/{slug} URL. */
  activeColorSlug: string | null;
}

export default function ProductPageClient({ product, activeColorSlug }: ProductPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const defaultColor = product.colors[0];
  const currentColorSlug = activeColorSlug ?? defaultColor.slug;

  const [size, setSize] = useState(searchParams.get("size") ?? product.sizes[0]);

  const activeVariant = useMemo(
    () => product.variants.find((v) => v.colorSlug === currentColorSlug && v.size === size),
    [product.variants, currentColorSlug, size],
  );

  const buildUrl = (colorSlug: string, nextSize: string) => {
    const base =
      colorSlug === defaultColor.slug ? `/products/${product.slug}` : `/products/${product.slug}/${colorSlug}`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("size", nextSize);
    return `${base}?${params.toString()}`;
  };

  const handleColorChange = (colorSlug: string) => {
    router.replace(buildUrl(colorSlug, size), { scroll: false });
  };

  const handleSizeChange = (nextSize: string) => {
    setSize(nextSize);
    router.replace(buildUrl(currentColorSlug, nextSize), { scroll: false });
  };

  const handleAddToBag = () => {
    console.log(`Added ${product.name} (${currentColorSlug}, ${size}) to bag`);
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    offers: product.variants
      .filter((v) => v.colorSlug === currentColorSlug)
      .map((v) => ({
        "@type": "Offer",
        sku: v.sku,
        price: v.price,
        priceCurrency: "INR",
        availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url: buildUrl(currentColorSlug, v.size),
      })),
  };

  return (
    <main className="mx-auto flex max-w-360 flex-col gap-24 px-6 pt-8 pb-24 lg:px-10">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

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

      <section className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
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
          onAddToBag={handleAddToBag}
        />
      </section>

      <SizeGuide stats={product.protectionStats} />
      <BuildYourKit items={product.buildYourKit} />
      <CustomerReviews reviews={product.reviews} />
      <RelatedProducts products={product.relatedProducts} />
      <ProductFAQ faqs={product.faqs} />
    </main>
  );
}
