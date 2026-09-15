"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Product, ReviewStatus } from "../lib/types";
import MultiImageUpload from "./MultiImageUpload";

interface Props {
  onDone: () => void;
  onCancel: () => void;
}

const STATUSES: ReviewStatus[] = ["approved", "pending", "rejected"];

export default function ReviewForm({ onDone, onCancel }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState("");
  const [guestName, setGuestName] = useState("");
  const [rating, setRating] = useState("5");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [isVerifiedPurchase, setIsVerifiedPurchase] = useState(false);
  const [status, setStatus] = useState<ReviewStatus>("approved");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ products: Product[] }>("/api/products?limit=100&status=all")
      .then((res) => {
        setProducts(res.products);
        setProduct((current) => current || (res.products[0]?._id ?? ""));
      })
      .catch(() => setProducts([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!product) {
      setError("Select a product first — create one if none exist yet.");
      return;
    }
    if (!guestName.trim()) {
      setError("Reviewer name is required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/api/admin/reviews", {
        product,
        guestName: guestName.trim(),
        rating: Number(rating),
        title: title || undefined,
        body: body || undefined,
        mediaUrls,
        isVerifiedPurchase,
        status,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>New review</h1>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      <p className="form-hint">
        For a review collected outside the site (phone, WhatsApp, in person) — a review submitted
        through the storefront by a real customer is created automatically after their order is
        delivered.
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          Product
          <select value={product} onChange={(e) => setProduct(e.target.value)} required>
            <option value="" disabled>
              Select a product
            </option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reviewer name
          <input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
        </label>
        <label>
          Rating
          <select value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as ReviewStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
      </div>

      <label className="full-width">
        Review text
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
      </label>

      <label className="full-width">
        Photos
        <MultiImageUpload purpose="review" values={mediaUrls} onChange={setMediaUrls} />
      </label>

      <div className="checkbox-row">
        <label>
          <input
            type="checkbox"
            checked={isVerifiedPurchase}
            onChange={(e) => setIsVerifiedPurchase(e.target.checked)}
          />
          Mark as verified purchase
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create review"}
        </button>
      </div>
    </form>
  );
}
