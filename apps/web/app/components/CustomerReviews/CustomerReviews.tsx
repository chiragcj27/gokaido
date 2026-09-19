"use client";

import { useMemo, useRef, useState } from "react";
import type { ProductReview, ReviewSummary } from "../../lib/dummyProduct";

export interface CustomerReviewsProps {
  summary: ReviewSummary;
  reviews: ProductReview[];
}

type SortOption = "highest" | "lowest" | "recent" | "helpful";
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

const SORT_LABELS: Record<SortOption, string> = {
  highest: "Highest Rating",
  lowest: "Lowest Rating",
  recent: "Most Recent",
  helpful: "Most Helpful",
};

function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          width={size}
          height={size}
          aria-hidden="true"
          className={index < Math.round(rating) ? "text-gold" : "text-paper/15"}
        >
          <path
            d="M10 1.5l2.6 5.3 5.9.8-4.3 4.1 1 5.8L10 14.7l-5.2 2.8 1-5.8L1.5 7.6l5.9-.8z"
            fill="currentColor"
          />
        </svg>
      ))}
    </div>
  );
}

function ThumbIcon({ down = false }: { down?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="14"
      height="14"
      aria-hidden="true"
      className={down ? "-scale-y-100" : ""}
    >
      <path
        d="M7 10v10H4V10zm3 10h8.5a2 2 0 0 0 1.94-1.52l1.4-5.6A2 2 0 0 0 19.9 10H14l.8-4.2a1.8 1.8 0 0 0-3.2-1.4L8 9v11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="10" height="10" aria-hidden="true">
      <path d="M4 12l5 5L20 6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        d="M4 20l1-4.5L15.5 5 19 8.5 8.5 19zM14 6l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M4 8h3l2-2h6l2 2h3v11H4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

const PAGE_SIZE = 3;

export default function CustomerReviews({ summary, reviews }: CustomerReviewsProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sortBy, setSortBy] = useState<SortOption>("highest");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [votes, setVotes] = useState<Record<string, { up: number; down: number; voted: "up" | "down" | null }>>(
    () => Object.fromEntries(reviews.map((r) => [r.id, { up: r.thumbsUp, down: r.thumbsDown, voted: null }])),
  );
  const carouselRef = useRef<HTMLDivElement>(null);

  const maxBar = Math.max(...summary.breakdown.map((row) => row.count));

  const visibleReviews = useMemo(() => {
    const filtered =
      ratingFilter === "all" ? reviews : reviews.filter((review) => Math.round(review.rating) === ratingFilter);
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        case "recent":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "helpful":
          return (votes[b.id]?.up ?? b.thumbsUp) - (votes[a.id]?.up ?? a.thumbsUp);
        default:
          return 0;
      }
    });
    return sorted;
  }, [reviews, ratingFilter, sortBy, votes]);

  const handleFilterChange = (value: RatingFilter) => {
    setRatingFilter(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setVisibleCount(PAGE_SIZE);
  };

  const handleVote = (id: string, type: "up" | "down") => {
    setVotes((prev) => {
      const current = prev[id];
      if (!current) return prev;
      if (current.voted === type) {
        return { ...prev, [id]: { ...current, [type]: current[type] - 1, voted: null } };
      }
      const reverted = current.voted ? { ...current, [current.voted]: current[current.voted] - 1 } : current;
      return { ...prev, [id]: { ...reverted, [type]: reverted[type] + 1, voted: type } };
    });
  };

  const scrollCarousel = (direction: 1 | -1) => {
    carouselRef.current?.scrollBy({ left: direction * 220, behavior: "smooth" });
  };

  return (
    <section className="flex flex-col gap-10">
      <h2 className="m-0 font-heading text-2xl font-bold text-paper">Reviews Summary</h2>

      <div className="grid grid-cols-1 divide-y divide-white/10 rounded-2xl border border-white/10 bg-panel sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-4">
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="font-heading text-4xl font-extrabold text-paper">{summary.average.toFixed(1)}</span>
            <Stars rating={summary.average} size={16} />
            <span className="font-sans text-xs text-paper/50">Based on {summary.totalCount} reviews</span>
          </div>
          <button
            type="button"
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/30 px-4 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink"
          >
            <PencilIcon /> Write a Review
          </button>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center">
          <span className="font-heading text-4xl font-extrabold text-gold">{summary.recommendPercent}%</span>
          <span className="max-w-40 font-sans text-xs text-paper/50">would recommend this product</span>
        </div>

        <div className="flex flex-col justify-center gap-1.5 px-6 py-8">
          {summary.breakdown.map((row) => (
            <div key={row.stars} className="flex items-center gap-2">
              <span className="w-5 shrink-0 font-sans text-xs text-paper/50">{row.stars}★</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${maxBar ? (row.count / maxBar) * 100 : 0}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-sans text-xs text-paper/40">{row.count}</span>
            </div>
          ))}
        </div>

        <div className={`flex-col gap-2 px-6 py-8 ${summary.talkedAbout.length > 0 ? "flex" : "hidden"}`}>
          <span className="font-heading text-xs font-bold tracking-[0.06em] text-paper/50 uppercase">
            Customers talked about
          </span>
          <div className="flex flex-wrap gap-2">
            {summary.talkedAbout.map((tag) => (
              <span key={tag} className="rounded-full bg-gold/15 px-3 py-1 font-sans text-xs font-semibold text-gold">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {summary.photoCount > 0 && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollCarousel(-1)}
            aria-label="Scroll photos left"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-paper transition-colors duration-200 hover:border-white/50"
          >
            <ChevronIcon direction="left" />
          </button>
          <div ref={carouselRef} className="flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1">
            {Array.from({ length: summary.photoCount }, (_, index) => (
              <div
                key={index}
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-paper/30"
              >
                <PhotoIcon />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            aria-label="Scroll photos right"
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-paper transition-colors duration-200 hover:border-white/50"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="m-0 font-heading text-lg font-bold text-paper">{visibleReviews.length} reviews</h3>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={ratingFilter}
            onChange={(event) =>
              handleFilterChange(event.target.value === "all" ? "all" : (Number(event.target.value) as RatingFilter))
            }
            aria-label="Filter reviews by rating"
            className="h-10 cursor-pointer rounded-lg border border-white/20 bg-panel px-3 font-sans text-xs text-paper"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((stars) => (
              <option key={stars} value={stars}>
                {stars} Star{stars > 1 ? "s" : ""}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 font-sans text-xs text-paper/50">
            Sort
            <select
              value={sortBy}
              onChange={(event) => handleSortChange(event.target.value as SortOption)}
              aria-label="Sort reviews"
              className="h-10 cursor-pointer rounded-lg border border-white/20 bg-panel px-3 font-sans text-xs text-paper"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-white/10">
        {visibleReviews.slice(0, visibleCount).map((review) => {
          const reviewVotes = votes[review.id];
          return (
            <article key={review.id} className="flex flex-col gap-3 py-6 first:pt-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-heading text-sm font-bold text-ink">
                    {review.author.charAt(0)}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-sm font-semibold text-paper">{review.author}</span>
                      {review.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[10px] font-semibold text-gold">
                          <CheckIcon /> Verified Buyer
                        </span>
                      )}
                    </div>
                    {(review.ageRange || review.sport) && (
                      <span className="font-sans text-[11px] text-paper/40">
                        {[review.ageRange && `Age Range: ${review.ageRange}`, review.sport && `Sport: ${review.sport}`]
                          .filter(Boolean)
                          .join(" | ")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 font-sans text-[11px] text-paper/40">
                  {new Date(review.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <Stars rating={review.rating} />
              <h4 className="m-0 font-heading text-sm font-bold text-paper">{review.title}</h4>
              <p className="m-0 font-sans text-sm leading-relaxed text-paper/70">{review.text}</p>

              <div className="flex items-center gap-4 font-sans text-xs text-paper/40">
                <span>Was this helpful?</span>
                <button
                  type="button"
                  onClick={() => handleVote(review.id, "up")}
                  aria-pressed={reviewVotes?.voted === "up"}
                  className={`flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 transition-colors duration-200 ${
                    reviewVotes?.voted === "up" ? "text-paper" : "text-paper/50 hover:text-paper"
                  }`}
                >
                  <ThumbIcon /> {reviewVotes?.up ?? review.thumbsUp}
                </button>
                <button
                  type="button"
                  onClick={() => handleVote(review.id, "down")}
                  aria-pressed={reviewVotes?.voted === "down"}
                  className={`flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 transition-colors duration-200 ${
                    reviewVotes?.voted === "down" ? "text-paper" : "text-paper/50 hover:text-paper"
                  }`}
                >
                  <ThumbIcon down /> {reviewVotes?.down ?? review.thumbsDown}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount < visibleReviews.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          className="mx-auto flex h-11 cursor-pointer items-center justify-center rounded-lg border border-paper bg-paper px-8 font-heading text-xs font-bold tracking-[0.04em] text-ink uppercase transition-colors duration-200 hover:bg-transparent hover:text-paper"
        >
          Show More
        </button>
      )}
    </section>
  );
}
