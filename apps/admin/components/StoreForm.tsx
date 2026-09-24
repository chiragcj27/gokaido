"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Store } from "../lib/types";
import ImageUpload from "./ImageUpload";

interface Props {
  store: Store | null;
  onDone: () => void;
  onCancel: () => void;
}

export default function StoreForm({ store, onDone, onCancel }: Props) {
  const isEdit = store !== null;
  const [city, setCity] = useState(store?.city ?? "");
  const [name, setName] = useState(store?.name ?? "");
  const [address, setAddress] = useState(store?.address ?? "");
  const [hours, setHours] = useState(store?.hours ?? "");
  const [phone, setPhone] = useState(store?.phone ?? "");
  const [image, setImage] = useState(store?.image ?? "");
  const [directionsUrl, setDirectionsUrl] = useState(store?.directionsUrl ?? "");
  const [sortOrder, setSortOrder] = useState(store ? String(store.sortOrder) : "0");
  const [isActive, setIsActive] = useState(store?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    // "" is sent explicitly for cleared optionals so the API unsets them.
    const payload = {
      city,
      name,
      address,
      hours,
      phone,
      image,
      directionsUrl,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      if (isEdit) await api.patch(`/api/stores/${store._id}`, payload);
      else await api.post("/api/stores", payload);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save store");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${store.name}` : "New store"}</h1>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          City (selector label)
          <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} required />
        </label>
        <label>
          Store name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        </label>
        <label>
          Address
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} maxLength={400} rows={3} required />
        </label>
        <label>
          Opening hours
          <input
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="11 AM - 10 PM (Open Everyday)"
            maxLength={120}
          />
        </label>
        <label>
          Phone
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" maxLength={30} />
        </label>
        <label>
          Directions link (optional)
          <input
            type="url"
            value={directionsUrl}
            onChange={(e) => setDirectionsUrl(e.target.value)}
            placeholder="https://maps.google.com/…"
          />
          <p className="form-hint">Leave empty to fall back to a Google Maps search on the address.</p>
        </label>
        <label>
          Display order
          <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          <p className="form-hint">Lower numbers appear first in the city selector.</p>
        </label>
        <label>
          <span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Show on website
          </span>
        </label>
      </div>

      <label>
        Store photo
        <ImageUpload purpose="store" value={image} onChange={setImage} />
        <p className="form-hint">Landscape photo (roughly 3:2) — cropped to fit beside the store details.</p>
      </label>

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : isEdit ? "Save changes" : "Create store"}
      </button>
    </form>
  );
}
