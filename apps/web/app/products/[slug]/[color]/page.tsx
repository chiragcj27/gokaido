import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPageClient from "../../../components/ProductPage/ProductPageClient";
import { getPdpProduct } from "../../../lib/pdp/getProduct";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string; color: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, color } = await params;
  const product = await getPdpProduct(slug);
  const colorOption = product?.colors.find((c) => c.slug === color);
  if (!product || !colorOption) return {};

  const title = `${product.name} — ${colorOption.name} | Gokaido`;
  const description = product.seo?.description || product.description;
  const image = colorOption.images[0];

  return {
    title,
    description,
    // Per the decided URL model, every color page canonicalizes back to the base product URL
    // so ranking signal consolidates on one page instead of variants competing with each other.
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title, description, type: "website", ...(image && { images: [image] }) },
    twitter: { card: "summary_large_image", title, description, ...(image && { images: [image] }) },
  };
}

export default async function ProductColorPage({ params }: PageProps) {
  const { slug, color } = await params;
  const product = await getPdpProduct(slug);
  if (!product) notFound();

  const colorOption = product.colors.find((c) => c.slug === color);
  if (!colorOption) notFound();

  return <ProductPageClient product={product} activeColorSlug={colorOption.slug} />;
}
