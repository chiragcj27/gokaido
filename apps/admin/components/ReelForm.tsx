"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Product, Reel } from "../lib/types";
import ImageUpload from "./ImageUpload";
import VideoUpload from "./VideoUpload";

interface Props {
  reel: Reel | null;
  onDone: () => void;
  onCancel: () => void;
}

export default function ReelForm({ reel, onDone, onCancel }: Props) {
  const isEdit = reel !== null;
  const [title, setTitle] = useState(reel?.title ?? "");
  const [videoUrl, setVideoUrl] = useState(reel?.videoUrl ?? "");
  const [posterUrl, setPosterUrl] = useState(reel?.posterUrl ?? "");
  const [instagramUrl, setInstagramUrl] = useState(reel?.instagramUrl ?? "");
  const [product, setProduct] = useState(reel?.product ?? "");
  const [sortOrder, setSortOrder] = useState(reel ? String(reel.sortOrder) : "0");
  const [isActive, setIsActive] = useState(reel?.isActive ?? true);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ products: Product[] }>("/api/products?limit=100&sort=newest&status=all")
      .then((res) => setProducts(res.products))
      .catch(() => setError("Failed to load products for the picker"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoUrl && !instagramUrl) {
      setError("Add an Instagram link, an uploaded video, or both");
      return;
    }
    setError(null);
    setSaving(true);

    // "" is sent explicitly for cleared optionals so the API unsets them.
    const payload = {
      title,
      videoUrl,
      posterUrl,
      instagramUrl,
      product,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      if (isEdit) await api.patch(`/api/reels/${reel._id}`, payload);
      else await api.post("/api/reels", payload);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save reel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${reel.title}` : "New reel"}</h1>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          Title (admin only)
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required />
          <p className="form-hint">A label to recognise this reel in the list — not shown on the website.</p>
        </label>
        <label>
          Featured product
          <select value={product} onChange={(e) => setProduct(e.target.value)}>
            <option value="">None — video only</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
                {p.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
          <p className="form-hint">
            Shown as the small card on the reel (image, name, price). Uses the product&apos;s card image — an inactive
            product is left off until it&apos;s live again.
          </p>
        </label>
        <label>
          Instagram reel link
          <input
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/…"
          />
          <p className="form-hint">
            Link to the specific reel (…/reel/XXXX/). Clicking the card opens it on Instagram. If you don&apos;t upload
            a video below, the site shows Instagram&apos;s own embed of this reel instead (public reels only).
          </p>
        </label>
        <label>
          Display order
          <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          <p className="form-hint">Lower numbers appear first in the carousel.</p>
        </label>
        <label>
          <span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Show on website
          </span>
        </label>
      </div>

      <label>
        Reel video (optional)
        <VideoUpload purpose="reel" value={videoUrl} onChange={setVideoUrl} />
        <p className="form-hint">
          Recommended for the polished look: it autoplays full-bleed like the design. Vertical (9:16) mp4/webm — use
          the original export (or download from Instagram) and compress to a few MB. Without it, the Instagram embed
          is used, which shows Instagram&apos;s header and doesn&apos;t autoplay.
        </p>
      </label>

      <label>
        Poster image (optional)
        <ImageUpload purpose="reel" value={posterUrl} onChange={setPosterUrl} />
        <p className="form-hint">Still frame shown before the video loads and on the side cards. Only used with an uploaded video.</p>
      </label>

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : isEdit ? "Save changes" : "Create reel"}
      </button>
    </form>
  );
}
