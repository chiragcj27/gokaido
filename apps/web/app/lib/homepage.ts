import { cache } from "react";
import { apiGet } from "./pdp/api";
import { DEFAULT_FAQS } from "./pdp/defaults";
import type { Faq } from "./pdp/types";
import { DUMMY_TRENDING_SEARCHES } from "./fallbacks";

export interface HomepageSettings {
  heroVideoUrl: string | null;
  heroVideoPosterUrl: string | null;
  heroBackgroundImageUrl: string | null;
  heroShowcaseImages: string[];
  trendingSearches: string[];
  faqs: Faq[];
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  beyondTheMedalUrl: string | null;
}

const FALLBACK: HomepageSettings = {
  heroVideoUrl: null,
  heroVideoPosterUrl: null,
  heroBackgroundImageUrl: null,
  heroShowcaseImages: [],
  trendingSearches: [],
  faqs: [],
  playStoreUrl: null,
  appStoreUrl: null,
  beyondTheMedalUrl: null,
};

// 5 min cache, tagged "homepage" for a future on-demand revalidateTag() call
// from an admin save — no such route exists yet (same gap as products/
// categories: those tags aren't wired to a purge endpoint either, so this
// just falls back to the plain 5 min TTL like everything else does today).
// Wrapped in React `cache` — the layout (search modal), homepage and PDP FAQs all read it per request.
export const getHomepageSettings = cache(async (): Promise<HomepageSettings> => {
  try {
    const { settings } = await apiGet<{ settings: Partial<HomepageSettings> }>("/homepage-settings", {
      revalidate: 300,
      tags: ["homepage"],
    });
    // Normalize rather than trusting the shape: this response can legitimately
    // predate a field (an API instance still running older code, or a cached
    // response from before a field was added). Reading `.length` off a key
    // that isn't there would 500 the whole homepage.
    return {
      heroVideoUrl: settings?.heroVideoUrl ?? null,
      heroVideoPosterUrl: settings?.heroVideoPosterUrl ?? null,
      heroBackgroundImageUrl: settings?.heroBackgroundImageUrl ?? null,
      heroShowcaseImages: Array.isArray(settings?.heroShowcaseImages) ? settings.heroShowcaseImages : [],
      trendingSearches: Array.isArray(settings?.trendingSearches) ? settings.trendingSearches : [],
      faqs: Array.isArray(settings?.faqs) ? settings.faqs : [],
      playStoreUrl: settings?.playStoreUrl ?? null,
      appStoreUrl: settings?.appStoreUrl ?? null,
      beyondTheMedalUrl: settings?.beyondTheMedalUrl ?? null,
    };
  } catch {
    // API down or nothing saved yet — hero renders with local fallback
    // assets rather than a broken page.
    return FALLBACK;
  }
});

/** Store-wide FAQs from admin, or the built-in defaults until some are saved. */
export async function getStoreFaqs(): Promise<Faq[]> {
  const { faqs } = await getHomepageSettings();
  return faqs.length > 0 ? faqs : DEFAULT_FAQS;
}

/** Trending search terms from admin, or generic martial-arts terms until some are saved. */
export async function getTrendingSearches(): Promise<string[]> {
  const { trendingSearches } = await getHomepageSettings();
  return trendingSearches.length > 0 ? trendingSearches : DUMMY_TRENDING_SEARCHES;
}
