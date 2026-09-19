import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "../../lib/dummyProduct";
import ProductPageClient from "../../components/ProductPage/ProductPageClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} (sample) | Gokaido`,
    robots: { index: false, follow: false },
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return <ProductPageClient product={product} activeColorSlug={null} basePath="/sample-product" />;
}
