import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "../../components/ProductPage/ProductPageClient";
import { getPdpProduct } from "../../lib/pdp/getProduct";

// Rendered on first request, then served from cache and refreshed in the background.
// The cache window is set per-fetch in lib/pdp/getProduct.ts; this covers the rendered page itself.
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPdpProduct(slug);
  if (!product) return {};

  const title = product.seo?.title || `${product.name} | Gokaido`;
  const description = product.seo?.description || product.description;
  const image = product.colors[0]?.images[0];

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title, description, type: "website", ...(image && { images: [image] }) },
    twitter: { card: "summary_large_image", title, description, ...(image && { images: [image] }) },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getPdpProduct(slug);
  if (!product) notFound();

  return <ProductPageClient product={product} activeColorSlug={null} />;
}
