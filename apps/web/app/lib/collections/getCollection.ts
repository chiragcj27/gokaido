import { cache } from "react";
import { apiGet, ApiError } from "../pdp/api";
import type { CollectionSubcategory } from "../../components/CollectionScroll/CollectionScroll";

// Catalogue changes are infrequent; the page is served from the fetch cache and refreshed in the
// background. Purge early with revalidateTag("collections") or `collection:{slug}`.
const COLLECTION_TTL = 300;
const PLACEHOLDER_IMAGE = "/dummy/product-placeholder.png";

interface ApiCollection {
  category: { name: string; slug: string; description?: string; image?: string };
  sections: {
    slug: string;
    name: string;
    description: string | null;
    image: string | null;
    total: number;
    products: {
      slug: string;
      name: string;
      image: string;
      price: number;
      colors: { name: string; hex: string }[];
    }[];
  }[];
}

export interface Collection {
  slug: string;
  name: string;
  description?: string;
  image?: string;
  subcategories: CollectionSubcategory[];
}

const formatPrice = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** One API call per category; wrapped in React `cache` so metadata and page share the load. */
export const getCollection = cache(async (categorySlug: string): Promise<Collection | null> => {
  let data: ApiCollection;
  try {
    data = await apiGet<ApiCollection>(`/collections/${encodeURIComponent(categorySlug)}`, {
      revalidate: COLLECTION_TTL,
      tags: ["collections", `collection:${categorySlug}`],
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }

  const { category, sections } = data;
  return {
    slug: category.slug,
    name: category.name,
    description: category.description,
    image: category.image,
    subcategories: sections.map((s) => ({
      key: s.slug,
      imageSrc: s.image ?? PLACEHOLDER_IMAGE,
      eyebrow: category.name,
      title: s.name,
      description: s.description ?? undefined,
      href: `/collections/${category.slug}/${s.slug}`,
      products: s.products.map((p) => ({
        key: p.slug,
        imageSrc: p.image,
        title: p.name,
        subtitle: s.name,
        price: formatPrice(p.price),
        colors: p.colors,
        href: `/products/${p.slug}`,
      })),
    })),
  };
});
