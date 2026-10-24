// Recent searches, per device (localStorage). Written by every search that
// actually runs — the search modal on submit and the /search page itself
// (RecordRecentSearch), so shared links, Back-navigation and "Search without
// filters" are remembered too. Browser-only: call from effects/handlers.

const RECENT_KEY = "gokaido:recent-searches";
export const MAX_RECENT = 5;

export function readRecentSearches(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function write(list: string[]): string[] {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — recents just won't persist
  }
  return list;
}

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

/** Moves `term` to the front (deduped case-insensitively); returns the new list. */
export function addRecentSearch(term: string): string[] {
  const t = term.trim();
  if (!t) return readRecentSearches();
  return write([t, ...readRecentSearches().filter((r) => !same(r, t))].slice(0, MAX_RECENT));
}

export function removeRecentSearch(term: string): string[] {
  return write(readRecentSearches().filter((r) => !same(r, term)));
}

export function clearRecentSearches(): string[] {
  return write([]);
}
