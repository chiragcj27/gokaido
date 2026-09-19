import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionScroll from "../../components/CollectionScroll/CollectionScroll";
import { getCollection } from "../../lib/collections/getCollection";

// Rendered on first request, then served from cache and refreshed in the background.
export const revalidate = 300;

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const collection = await getCollection(category);
  if (!collection) return {};

  const title = `${collection.name} | Gokaido`;
  const description = collection.description ?? `Shop Gokaido ${collection.name} gear.`;
  return {
    title,
    description,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: { title, description, type: "website", ...(collection.image && { images: [collection.image] }) },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { category } = await params;
  const collection = await getCollection(category);
  if (!collection || collection.subcategories.length === 0) notFound();

  return <CollectionScroll categoryName={collection.name} subcategories={collection.subcategories} />;
}
