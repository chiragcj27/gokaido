import type { ProductReview } from "../../lib/dummyProduct";

export interface CustomerReviewsProps {
  reviews: ProductReview[];
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          viewBox="0 0 20 20"
          width="14"
          height="14"
          aria-hidden="true"
          className={index < rating ? "text-gold" : "text-paper/20"}
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

export default function CustomerReviews({ reviews }: CustomerReviewsProps) {
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="m-0 font-heading text-2xl font-bold text-paper">Customer Reviews</h2>
        <div className="flex items-center gap-2">
          <Stars rating={Math.round(average)} />
          <span className="font-heading text-sm font-semibold text-paper">{average.toFixed(1)}</span>
          <span className="font-sans text-xs text-paper/50">({reviews.length} reviews)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-panel p-5"
          >
            <div className="flex items-center justify-between">
              <Stars rating={review.rating} />
              <span className="font-sans text-[11px] text-paper/40">
                {new Date(review.date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
              </span>
            </div>
            <p className="m-0 font-sans text-sm leading-relaxed text-paper/70">{review.text}</p>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5">
                <span className="font-heading text-xs font-semibold text-paper">{review.author}</span>
                {review.verified && (
                  <span className="rounded-full bg-gold/15 px-2 py-0.5 font-sans text-[10px] font-semibold text-gold">
                    Verified Purchase
                  </span>
                )}
              </div>
              <span className="font-sans text-[11px] text-paper/40">Helpful ({review.helpfulCount})</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
