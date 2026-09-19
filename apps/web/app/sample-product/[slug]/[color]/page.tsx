import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../../lib/dummyProduct";
import ProductPageClient from "../../../components/ProductPage/ProductPageClient";

interface PageProps {
  params: Promise<{ slug: string; color: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, color } = await params;
  const product = getProductBySlug(slug);
  const colorOption = product?.colors.find((c) => c.slug === color);
  if (!product || !colorOption) return {};

  return {
    title: `${product.name} — ${colorOption.name} (sample) | Gokaido`,
    description: product.description,
    robots: { index: false, follow: false },
  };
}

export default async function ProductColorPage({ params }: PageProps) {
  const { slug, color } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const colorOption = product.colors.find((c) => c.slug === color);
  if (!colorOption) notFound();

  return <ProductPageClient product={product} activeColorSlug={colorOption.slug} basePath="/sample-product" />;
}
