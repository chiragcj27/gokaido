import Link from "next/link";

export interface PaginationProps {
  page: number;
  totalPages: number;
  /** Builds the link for a given page number (keeps other query params intact). */
  hrefFor: (page: number) => string;
}

/** Page numbers to show: always first/last, a window around the current page, gaps as "…". */
function pageItems(page: number, totalPages: number): (number | "gap")[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const p of sorted) {
    const prev = items[items.length - 1];
    if (typeof prev === "number" && p - prev === 2) items.push(prev + 1);
    else if (typeof prev === "number" && p - prev > 2) items.push("gap");
    items.push(p);
  }
  return items;
}

const base =
  "flex h-10 min-w-10 items-center justify-center rounded-full border px-3 font-heading text-sm font-bold no-underline transition-colors duration-200";
const idle = `${base} border-white/15 text-paper hover:border-white/40 hover:bg-white/8`;
const disabled = `${base} border-white/10 text-paper/30`;

export default function Pagination({ page, totalPages, hrefFor }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className={idle}>
          ← Prev
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          ← Prev
        </span>
      )}

      {pageItems(page, totalPages).map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 font-sans text-paper/40">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={`${base} border-red bg-red text-paper`}>
            {item}
          </span>
        ) : (
          <Link key={item} href={hrefFor(item)} aria-label={`Page ${item}`} className={idle}>
            {item}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} rel="next" className={idle}>
          Next →
        </Link>
      ) : (
        <span className={disabled} aria-disabled="true">
          Next →
        </span>
      )}
    </nav>
  );
}
