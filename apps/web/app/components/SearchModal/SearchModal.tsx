"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { ApiProductSuggestion } from "../../lib/pdp/apiTypes";
import {
  addRecentSearch,
  clearRecentSearches,
  readRecentSearches,
  removeRecentSearch,
} from "../../lib/search/recentSearches";

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  /** Admin-managed terms (homepage settings), or defaults — also drive the animated placeholder. */
  trendingSearches: string[];
  /** Admin-flagged bestsellers, or placeholders. */
  bestsellers: SearchModalProduct[];
}

export interface SearchModalProduct {
  slug: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  price: number;
  mrp: number;
  colors: { name: string; hex: string }[];
}

const formatInr = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const SUGGEST_DEBOUNCE_MS = 200;
const SUGGEST_MIN_CHARS = 2;

const CLOSE_MS = 250;

const TYPE_MS = 90;
const DELETE_MS = 45;
const HOLD_MS = 1400;
const GAP_MS = 300;

/** Types each word, holds, deletes it, then moves to the next — only while `active`. */
function useTypewriter(words: string[], active: boolean) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!active) {
      setWordIndex(0);
      setText("");
      setDeleting(false);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setText(words[wordIndex]);
      const id = setTimeout(() => setWordIndex((i) => (i + 1) % words.length), 2200);
      return () => clearTimeout(id);
    }

    const word = words[wordIndex];
    let id: ReturnType<typeof setTimeout>;

    if (!deleting) {
      id =
        text.length < word.length
          ? setTimeout(() => setText(word.slice(0, text.length + 1)), TYPE_MS)
          : setTimeout(() => setDeleting(true), HOLD_MS);
    } else {
      id =
        text.length > 0
          ? setTimeout(() => setText((t) => t.slice(0, -1)), DELETE_MS)
          : setTimeout(() => {
              setDeleting(false);
              setWordIndex((i) => (i + 1) % words.length);
            }, GAP_MS);
    }

    return () => clearTimeout(id);
  }, [active, words, wordIndex, text, deleting]);

  return text;
}

/** Product-name suggestions for the typed text (GET /products/suggest), debounced; [] on any failure. */
function useSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<ApiProductSuggestion[]>([]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < SUGGEST_MIN_CHARS) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/products/suggest?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        const data = res.ok ? ((await res.json()) as { suggestions?: ApiProductSuggestion[] }) : {};
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : []);
      } catch {
        if (!controller.signal.aborted) setSuggestions([]);
      }
    }, SUGGEST_DEBOUNCE_MS);
    return () => {
      clearTimeout(id);
      controller.abort();
    };
  }, [query]);

  return suggestions;
}

export default function SearchModal({ open, onClose, trendingSearches, bestsellers }: SearchModalProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  // Mount first, flip `shown` a frame later so the enter transition runs; reverse on close.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setRecent(readRecentSearches());
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const id = setTimeout(() => {
      setMounted(false);
      setQuery("");
      setFocused(false);
    }, CLOSE_MS);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const animatedWord = useTypewriter(trendingSearches, open && query === "" && !focused);
  const suggestions = useSuggestions(query);
  const typed = query.trim();

  const submit = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (!term) return;
      addRecentSearch(term);
      onClose();
      router.push(`/search?q=${encodeURIComponent(term)}`);
    },
    [onClose, router],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(query);
  };

  const clearRecent = () => setRecent(clearRecentSearches());
  const removeRecent = (term: string) => setRecent(removeRecentSearch(term));

  if (!mounted || typeof document === "undefined") return null;

  const sectionLabel = "font-heading text-sm font-semibold tracking-[0.06em] text-paper/60 uppercase";
  const chip =
    "cursor-pointer rounded-full border border-white/10 bg-white/4 font-sans text-paper transition-colors duration-200 hover:border-white/30 hover:bg-white/8";

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm transition-opacity duration-250 ease-out sm:p-8 ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-6xl outline-none overflow-hidden rounded-3xl border border-white/10 bg-panel shadow-2xl transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          shown ? "translate-y-0 scale-100 opacity-100" : "-translate-y-4 scale-[0.98] opacity-0"
        }`}
      >
        <form onSubmit={handleSubmit} role="search" className="border-b border-white/10 p-4 sm:p-8">
          <div className="relative flex h-14 items-center gap-4 rounded-full bg-paper px-5 sm:h-16 sm:px-8">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="shrink-0 text-red">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>

            <div className="relative h-full min-w-0 flex-1">
              <input
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder={focused ? "Search products" : undefined}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search products"
                autoComplete="off"
                className={`h-full w-full border-0 bg-transparent font-sans text-base text-ink outline-none sm:text-lg ${
                  query === "" && !focused ? "caret-transparent" : ""
                }`}
              />
              {query === "" && !focused && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-0.5 truncate font-sans text-base text-ink/70 sm:text-lg"
                >
                  Search for &quot;{animatedWord}
                  <span className="inline-block h-[1.1em] w-px animate-pulse bg-ink" />
                  &quot;
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent text-ink/50 transition-colors duration-200 hover:text-ink"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </form>

        <div className="flex flex-col gap-8 p-4 sm:p-8">
          {typed.length >= SUGGEST_MIN_CHARS && (
            <section aria-label="Suggestions" className="flex flex-col gap-1">
              {suggestions.map((item) => (
                <Link
                  key={item.slug}
                  href={`/products/${item.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-4 rounded-lg px-3 py-2 text-inherit no-underline transition-colors duration-200 hover:bg-white/6"
                >
                  <div className="relative h-12 w-15 shrink-0 overflow-hidden rounded-md bg-ink">
                    {item.cardImage && (
                      <Image src={item.cardImage} alt="" fill sizes="60px" className="object-cover" />
                    )}
                  </div>
                  <span className="min-w-0 flex-1 truncate font-sans text-base text-paper">{item.name}</span>
                  {item.minPrice != null && (
                    <span className="shrink-0 font-heading text-sm font-bold text-paper/70">
                      {formatInr(item.minPrice)}
                    </span>
                  )}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => submit(typed)}
                className="flex cursor-pointer items-center gap-4 rounded-lg border-0 bg-transparent px-3 py-3 text-left font-sans text-base text-paper/70 transition-colors duration-200 hover:bg-white/6 hover:text-paper"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="ml-1 shrink-0 text-red">
                  <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16.5 16.5L21 21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                <span className="truncate">
                  Search for &ldquo;<span className="text-paper">{typed}</span>&rdquo;
                </span>
              </button>
            </section>
          )}

          {recent.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className={`m-0 ${sectionLabel}`}>Recent Searches</h2>
                <button
                  type="button"
                  onClick={clearRecent}
                  className="cursor-pointer border-0 bg-transparent font-sans text-sm text-paper/40 transition-colors duration-200 hover:text-paper"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {recent.map((term) => (
                  <div key={term} className={`${chip} flex items-center rounded-lg text-base`}>
                    <button
                      type="button"
                      onClick={() => submit(term)}
                      className="flex cursor-pointer items-center gap-3 border-0 bg-transparent py-2.5 pr-2 pl-4 font-sans text-base text-paper"
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="text-paper/50">
                        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                      {term}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRecent(term)}
                      aria-label={`Remove "${term}" from recent searches`}
                      className="flex h-full cursor-pointer items-center border-0 bg-transparent py-2.5 pr-3 pl-1 text-paper/40 transition-colors duration-200 hover:text-paper"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
                        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="flex flex-col gap-4">
            <h2 className={`m-0 flex items-center gap-3 ${sectionLabel}`}>
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="text-red">
                <path
                  d="M3 17l6-6 4 4 8-8M15 7h6v6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Trending Searches
            </h2>
            <div className="flex flex-wrap gap-3">
              {trendingSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => submit(term)}
                  className={`${chip} px-4 py-2 text-sm`}
                >
                  {term}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-5 border-t border-white/10 pt-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className={`m-0 ${sectionLabel}`}>Bestsellers in Sports &amp; Lifestyle</h2>
              <Link
                href="/best-sellers"
                onClick={onClose}
                className="font-heading text-sm font-bold whitespace-nowrap text-red no-underline"
              >
                Explore Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {bestsellers.map((item) => (
                <Link
                  key={item.slug}
                  href={`/products/${item.slug}`}
                  onClick={onClose}
                  className="flex flex-col gap-3 text-inherit no-underline"
                >
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-ink">
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 25vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <h3 className="m-0 truncate font-heading text-lg font-semibold text-paper">{item.title}</h3>
                      <p className="m-0 font-sans text-xs text-paper/50">{item.subtitle}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span className="font-heading text-sm font-bold text-paper">{formatInr(item.price)}</span>
                      {item.mrp > item.price && (
                        <span className="font-sans text-[11px] text-paper/40 line-through">{formatInr(item.mrp)}</span>
                      )}
                    </div>
                  </div>
                  {item.colors.length > 0 && (
                    <div className="flex items-center gap-3 font-sans text-xs text-paper/70">
                      <span>{item.colors[0].name}</span>
                      <div className="flex gap-2">
                        {item.colors.map((color) => (
                          <span
                            key={color.name}
                            aria-hidden="true"
                            style={{ backgroundColor: color.hex }}
                            className="h-4 w-4 rounded-full border border-white/25"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
