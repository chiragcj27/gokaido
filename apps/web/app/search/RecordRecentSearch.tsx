"use client";

import { useEffect } from "react";
import { addRecentSearch } from "../lib/search/recentSearches";

/** Remembers the query this /search page is showing in the modal's Recent Searches. */
export default function RecordRecentSearch({ query }: { query: string }) {
  useEffect(() => {
    if (query) addRecentSearch(query);
  }, [query]);
  return null;
}
