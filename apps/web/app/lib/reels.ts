import { apiGet } from "./pdp/api";

export interface ReelProduct {
  name: string;
  slug: string;
  image: string | null;
  price: number;
}

export interface Reel {
  id: string;
  /** Uploaded file — null means the card falls back to the Instagram embed. */
  videoUrl: string | null;
  posterUrl: string | null;
  instagramUrl: string | null;
  product: ReelProduct | null;
}

interface ApiReel {
  _id: string;
  videoUrl?: string;
  posterUrl?: string;
  instagramUrl?: string;
  product: { name: string; slug: string; image?: string; price: number } | null;
}

// 5 min cache, tagged "reels" — same TTL/no-purge-route situation as
// getStores. Empty list on failure; the homepage then shows its dummy reels
// instead of a broken section.
export async function getReels(): Promise<Reel[]> {
  try {
    const { reels } = await apiGet<{ reels: ApiReel[] }>("/reels", { revalidate: 300, tags: ["reels"] });
    if (!Array.isArray(reels)) return [];
    return reels.map((r) => ({
      id: r._id,
      videoUrl: r.videoUrl ?? null,
      posterUrl: r.posterUrl ?? null,
      instagramUrl: r.instagramUrl ?? null,
      product: r.product
        ? { name: r.product.name, slug: r.product.slug, image: r.product.image ?? null, price: r.product.price }
        : null,
    }));
  } catch {
    return [];
  }
}

// Dummy reels until the admin adds real ones (Reels page). Reuses the hero reel
// as the video, with the placeholder card as the attached product.
export const DUMMY_REELS: Reel[] = [1, 2, 3].map((n) => ({
  id: `dummy-reel-${n}`,
  videoUrl: "/hero/hero-reel.mp4",
  posterUrl: "/hero/hero-reel-poster.jpg",
  instagramUrl: null,
  product: { name: "Lorem ipsum", slug: `dummy-reel-product-${n}`, image: "/card/card-sample.png", price: 2499 },
}));
