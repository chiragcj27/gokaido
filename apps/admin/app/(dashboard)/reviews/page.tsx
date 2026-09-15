"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Review, ReviewStatus } from "../../../lib/types";
import ReviewForm from "../../../components/ReviewForm";

const FILTERS: (ReviewStatus | "all")[] = ["pending", "approved", "rejected", "all"];

function reviewerLabel(review: Review): string {
  if (review.guestName) return review.guestName;
  if (typeof review.user === "object" && review.user) return review.user.name ?? review.user.mobile;
  return "—";
}

function productLabel(product: Review["product"]): string {
  return typeof product === "string" ? product : product.name;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ reviews: Review[] }>(`/api/admin/reviews?status=${filter}&limit=100`);
      setReviews(res.reviews);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApprove(review: Review) {
    await api.patch(`/api/admin/reviews/${review._id}/approve`);
    load();
  }

  async function handleReject(review: Review) {
    const reason = window.prompt("Reason for rejecting this review (optional):") ?? undefined;
    await api.patch(`/api/admin/reviews/${review._id}/reject`, { reason });
    load();
  }

  if (creating) {
    return (
      <ReviewForm
        onDone={() => {
          setCreating(false);
          load();
        }}
        onCancel={() => setCreating(false)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reviews</h1>
        <button type="button" onClick={() => setCreating(true)}>
          New review
        </button>
      </div>

      <div className="form-grid">
        <label>
          Status
          <select value={filter} onChange={(e) => setFilter(e.target.value as ReviewStatus | "all")}>
            {FILTERS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review</th>
                <th>Verified</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td>{productLabel(r.product)}</td>
                  <td>{reviewerLabel(r)}</td>
                  <td className="mono">{r.rating} / 5</td>
                  <td>
                    {r.title && <strong>{r.title}</strong>}
                    {r.body && <div>{r.body}</div>}
                  </td>
                  <td>{r.isVerifiedPurchase ? "Yes" : "No"}</td>
                  <td>
                    <span
                      className={`pill ${
                        r.status === "approved"
                          ? "pill-active"
                          : r.status === "rejected"
                            ? "pill-danger"
                            : "pill-warning"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="row-actions">
                    {r.status !== "approved" && (
                      <button type="button" onClick={() => handleApprove(r)}>
                        Approve
                      </button>
                    )}
                    {r.status !== "rejected" && (
                      <button type="button" onClick={() => handleReject(r)}>
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No reviews here yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
