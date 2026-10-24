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

function Stars({ rating, size = 14, className = "" }: { rating: number; size?: number; className?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          width={size}
          height={size}
          aria-hidden="true"
          className={`${index < Math.round(rating) ? "text-gold max-lg:text-paper/90" : "text-paper/15"} ${className}`}
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
        className="max-lg:fill-current"
      />
    </svg>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
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

  const hasReviews = summary.totalCount > 0;

  return (
    <section className="flex flex-col gap-10">
      <h2 className="m-0 font-heading text-2xl font-bold text-paper max-lg:text-[22px] max-lg:font-semibold">Reviews Summary</h2>

      {/* Mobile: just the score and the recommend % side by side, split by a rule; the breakdown and
          "talked about" cells are desktop-only. */}
      <div className="grid grid-cols-[3fr_2fr] rounded-2xl border border-white/10 bg-panel max-lg:-mt-2 max-lg:rounded-none max-lg:border-0 max-lg:border-b max-lg:border-white/30 max-lg:bg-transparent max-lg:pb-5 lg:grid-cols-4 lg:divide-x lg:divide-white/10">
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-8 text-center max-lg:justify-start max-lg:border-r max-lg:border-white/40 max-lg:px-2 max-lg:py-6">
          <div className="flex flex-col items-center gap-2 max-lg:flex-row max-lg:flex-wrap max-lg:justify-center max-lg:gap-x-3">
            <span className="font-heading text-4xl font-extrabold text-paper max-lg:text-[28px] max-lg:font-semibold max-lg:text-paper/90">
              {summary.average.toFixed(1)}
            </span>
            <Stars rating={summary.average} size={16} className="max-lg:h-5 max-lg:w-5" />
            <span className="font-sans text-xs text-paper/50 max-lg:basis-full max-lg:font-heading max-lg:text-sm">
              {hasReviews
                ? `Based on ${summary.totalCount} review${summary.totalCount === 1 ? "" : "s"}`
                : "No reviews yet"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2 px-6 py-8 text-center max-lg:px-2">
          <span
            className={`font-heading font-extrabold text-gold max-lg:font-semibold max-lg:text-paper/90 ${hasReviews ? "text-4xl max-lg:text-[28px]" : "text-2xl max-lg:text-xl"}`}
          >
            {hasReviews ? `${summary.recommendPercent}%` : "Be the first"}
          </span>
          <span className="max-w-40 font-sans text-xs text-paper/50 max-lg:max-w-32 max-lg:font-heading max-lg:text-base max-lg:text-paper/90">
            {hasReviews ? "would recommend this product" : "to review this product"}
          </span>
        </div>

        <div className="hidden flex-col justify-center gap-1.5 px-6 py-8 lg:flex">
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

        <div className={`hidden flex-col gap-2 px-6 py-8 ${summary.talkedAbout.length > 0 ? "lg:flex" : ""}`}>
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
            className="hidden h-9 w-9 lg:flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-paper transition-colors duration-200 hover:border-white/50"
          >
            <ChevronIcon direction="left" />
          </button>
          <div
            ref={carouselRef}
            className="flex flex-1 gap-3 overflow-x-auto scroll-smooth pb-1 max-lg:-mx-4 max-lg:snap-x max-lg:snap-mandatory max-lg:gap-2.5 max-lg:px-4"
          >
            {Array.from({ length: summary.photoCount }, (_, index) => (
              <div
                key={index}
                className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-paper/30 max-lg:aspect-square max-lg:h-auto max-lg:w-[62%] max-lg:snap-center max-lg:rounded-none"
              >
                <PhotoIcon />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => scrollCarousel(1)}
            aria-label="Scroll photos right"
            className="hidden h-9 w-9 lg:flex shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 text-paper transition-colors duration-200 hover:border-white/50"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-8 max-lg:-mb-4 max-lg:border-t-0 max-lg:pt-0 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="m-0 font-heading text-lg font-bold text-paper max-lg:border-b-2 max-lg:border-paper max-lg:pb-2 max-lg:text-[22px] max-lg:font-semibold">
          {visibleReviews.length} reviews
        </h3>

        <div className="flex flex-wrap items-center gap-3 max-lg:justify-between max-lg:border-b max-lg:border-white/30 max-lg:pt-2 max-lg:pb-5">
          <select
            value={ratingFilter}
            onChange={(event) =>
              handleFilterChange(event.target.value === "all" ? "all" : (Number(event.target.value) as RatingFilter))
            }
            aria-label="Filter reviews by rating"
            className="h-10 cursor-pointer rounded-lg border border-white/20 bg-panel px-3 font-sans text-xs text-paper max-lg:rounded-md max-lg:border-paper/80 max-lg:bg-ink max-lg:px-4 max-lg:font-heading max-lg:text-sm max-lg:font-semibold"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map((stars) => (
              <option key={stars} value={stars}>
                {stars} Star{stars > 1 ? "s" : ""}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 font-sans text-xs text-paper/50 max-lg:gap-3 max-lg:font-heading max-lg:text-sm max-lg:font-semibold max-lg:text-paper">
            Sort
            <select
              value={sortBy}
              onChange={(event) => handleSortChange(event.target.value as SortOption)}
              aria-label="Sort reviews"
              className="h-10 cursor-pointer rounded-lg border border-white/20 bg-panel px-3 font-sans text-xs text-paper max-lg:border-0 max-lg:bg-transparent max-lg:px-0 max-lg:font-heading max-lg:text-base max-lg:font-normal"
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

      <div className="flex flex-col divide-y divide-white/10 max-lg:divide-white/30">
        {visibleReviews.slice(0, visibleCount).map((review) => {
          const reviewVotes = votes[review.id];
          return (
            <article key={review.id} className="flex flex-col gap-3 py-6 first:pt-0 max-lg:gap-2 max-lg:py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 max-lg:mb-2 max-lg:gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold font-heading text-sm font-bold text-ink max-lg:h-15 max-lg:w-15 max-lg:bg-[#f0dfcc] max-lg:text-lg">
                    <span className="lg:hidden">{initials(review.author)}</span>
                    <span className="max-lg:hidden">{review.author.charAt(0)}</span>
                  </span>
                  <div className="flex flex-col gap-0.5 max-lg:gap-2">
                    <div className="flex flex-wrap items-center gap-2 max-lg:gap-x-3">
                      <span className="font-heading text-sm font-semibold text-paper max-lg:text-xl">{review.author}</span>
                      {review.verified && (
                        <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[10px] font-semibold text-gold max-lg:flex-row-reverse max-lg:gap-1.5 max-lg:bg-transparent max-lg:px-0 max-lg:font-heading max-lg:text-xs max-lg:text-paper">
                          <span className="flex max-lg:rounded-full max-lg:bg-paper max-lg:p-0.5 max-lg:text-ink">
                            <CheckIcon />
                          </span>
                          Verified Buyer
                        </span>
                      )}
                    </div>
                    {(review.ageRange || review.sport) && (
                      <span className="flex flex-wrap gap-x-6 gap-y-1 font-heading text-sm text-paper/85 lg:hidden">
                        {review.ageRange && (
                          <span>
                            <span className="mr-2 font-semibold text-paper">Age Range</span>
                            {review.ageRange}
                          </span>
                        )}
                        {review.sport && (
                          <span>
                            <span className="mr-2 font-semibold text-paper">Sport</span>
                            {review.sport}
                          </span>
                        )}
                      </span>
                    )}
                    {(review.ageRange || review.sport) && (
                      <span className="font-sans text-[11px] text-paper/40 max-lg:hidden">
                        {[review.ageRange && `Age Range: ${review.ageRange}`, review.sport && `Sport: ${review.sport}`]
                          .filter(Boolean)
                          .join(" | ")}
                      </span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 font-sans text-[11px] text-paper/40 max-lg:hidden">
                  {new Date(review.date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>

              <Stars rating={review.rating} className="max-lg:h-5 max-lg:w-5" />
              <h4 className="m-0 font-heading text-sm font-bold text-paper max-lg:mt-1 max-lg:font-sans max-lg:text-[15px]">
                {review.title}
              </h4>
              <p className="m-0 font-sans text-sm leading-relaxed text-paper/70 max-lg:text-[15px] max-lg:leading-[1.65] max-lg:font-light max-lg:text-paper/85">
                {review.text}
              </p>

              <div className="flex items-center gap-4 font-sans text-xs text-paper/40 max-lg:mt-4 max-lg:font-heading max-lg:text-base max-lg:text-paper/50">
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
          className="mx-auto flex h-11 cursor-pointer items-center justify-center rounded-lg border border-paper bg-paper px-8 font-heading text-xs font-bold tracking-[0.04em] text-ink uppercase transition-colors duration-200 hover:bg-transparent hover:text-paper max-lg:-mt-4 max-lg:h-10 max-lg:w-41 max-lg:rounded-md max-lg:border-white/30 max-lg:bg-ink max-lg:text-base max-lg:font-semibold max-lg:tracking-normal max-lg:text-paper max-lg:normal-case"
        >
          Show More
        </button>
      )}
    </section>
  );
}
