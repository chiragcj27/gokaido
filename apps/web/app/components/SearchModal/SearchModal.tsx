"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

// Pending a trending-searches endpoint; these also drive the animated placeholder.
const TRENDING_SEARCHES = [
  "Carrom Boards",
  "Basketball",
  "Rain Coats",
  "Cricket Bats",
  "Yoga Mats",
  "Badminton Rackets",
  "Travel Bags",
];

// Pending a bestsellers endpoint — dummy data matching the Figma frame.
const BESTSELLERS = Array.from({ length: 4 }, (_, i) => ({
  id: i,
  title: "Lorem ipsum",
  subtitle: "Lorem ipsum",
  price: "₹2499.00",
  originalPrice: "₹000.00",
  image: "/dummy/product-placeholder.png",
  colors: [
    { name: "Red", hex: "#c8102e" },
    { name: "White", hex: "#ffffff" },
    { name: "Blue", hex: "#1d4ed8" },
  ],
}));

const RECENT_KEY = "gokaido:recent-searches";
const MAX_RECENT = 5;
const CLOSE_MS = 250;

const TYPE_MS = 90;
const DELETE_MS = 45;
const HOLD_MS = 1400;
const GAP_MS = 300;

function readRecent(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // storage unavailable — recents just won't persist
  }
}

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

export default function SearchModal({ open, onClose }: SearchModalProps) {
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
      setRecent(readRecent());
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

  const animatedWord = useTypewriter(TRENDING_SEARCHES, open && query === "" && !focused);

  const submit = useCallback(
    (raw: string) => {
      const term = raw.trim();
      if (!term) return;
      const next = [term, ...readRecent().filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      writeRecent(next);
      onClose();
      router.push(`/search?q=${encodeURIComponent(term)}`);
    },
    [onClose, router],
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit(query);
  };

  const clearRecent = () => {
    writeRecent([]);
    setRecent([]);
  };

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
                  <button
                    key={term}
                    type="button"
                    onClick={() => submit(term)}
                    className={`${chip} flex items-center gap-3 rounded-lg px-4 py-2.5 text-base`}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" className="text-paper/50">
                      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    {term}
                  </button>
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
              {TRENDING_SEARCHES.map((term) => (
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
                href="/collections"
                onClick={onClose}
                className="font-heading text-sm font-bold whitespace-nowrap text-red no-underline"
              >
                Explore Catalog →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
              {BESTSELLERS.map((item) => (
                <article key={item.id} className="flex flex-col gap-3">
                  <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-ink">
                    <Image
                      src={item.image}
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
                      <span className="font-heading text-sm font-bold text-paper">{item.price}</span>
                      <span className="font-sans text-[11px] text-paper/40 line-through">{item.originalPrice}</span>
                    </div>
                  </div>
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
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
