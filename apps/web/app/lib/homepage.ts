import { apiGet } from "./pdp/api";

export interface HomepageSettings {
  heroVideoUrl: string | null;
  heroVideoPosterUrl: string | null;
  heroBackgroundImageUrl: string | null;
  heroShowcaseImages: string[];
}

const FALLBACK: HomepageSettings = {
  heroVideoUrl: null,
  heroVideoPosterUrl: null,
  heroBackgroundImageUrl: null,
  heroShowcaseImages: [],
};

// 5 min cache, tagged "homepage" for a future on-demand revalidateTag() call
// from an admin save — no such route exists yet (same gap as products/
// categories: those tags aren't wired to a purge endpoint either, so this
// just falls back to the plain 5 min TTL like everything else does today).
export async function getHomepageSettings(): Promise<HomepageSettings> {
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
    };
  } catch {
    // API down or nothing saved yet — hero renders with local fallback
    // assets rather than a broken page.
    return FALLBACK;
  }
}
