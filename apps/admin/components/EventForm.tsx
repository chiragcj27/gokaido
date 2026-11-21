"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { GokaidoEvent } from "../lib/types";
import MultiImageUpload from "./MultiImageUpload";

interface Props {
  event: GokaidoEvent | null;
  onDone: () => void;
  onCancel: () => void;
}

export default function EventForm({ event, onDone, onCancel }: Props) {
  const isEdit = event !== null;
  const [name, setName] = useState(event?.name ?? "");
  const [year, setYear] = useState(event?.year ?? "");
  const [category, setCategory] = useState(event?.category ?? "");
  const [about, setAbout] = useState(event?.about ?? "");
  const [dates, setDates] = useState(event?.dates ?? "");
  const [place, setPlace] = useState(event?.place ?? "");
  const [sport, setSport] = useState(event?.sport ?? "");
  const [recognition, setRecognition] = useState(event?.recognition ?? "");
  const [hostedBy, setHostedBy] = useState(event?.hostedBy ?? "");
  const [images, setImages] = useState<string[]>(event?.images ?? []);
  const [sortOrder, setSortOrder] = useState(event ? String(event.sortOrder) : "0");
  const [isActive, setIsActive] = useState(event?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0) {
      setError("Add at least one photo");
      return;
    }
    setError(null);
    setSaving(true);

    // "" is sent explicitly for cleared optionals so the API unsets them.
    const payload = {
      name,
      year,
      category,
      about,
      dates,
      place,
      sport,
      recognition,
      hostedBy,
      images,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    };

    try {
      if (isEdit) await api.patch(`/api/events/${event._id}`, payload);
      else await api.post("/api/events", payload);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${event.name}` : "New event"}</h1>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          Event name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="8th WGKF World Goju Ryu Championship"
            maxLength={160}
            required
          />
        </label>
        <label>
          Year
          <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" maxLength={20} required />
          <p className="form-hint">Small label above the name in the event list.</p>
        </label>
        <label>
          Event type (optional)
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="World Championship"
            maxLength={80}
          />
          <p className="form-hint">Shown beside the year, e.g. “2026 · World Championship”.</p>
        </label>
        <label>
          Dates (optional)
          <input value={dates} onChange={(e) => setDates(e.target.value)} placeholder="5–10 October 2026" maxLength={80} />
        </label>
        <label>
          Event place
          <textarea
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Shree Shiv Chhatrapati Sports Complex, Mahalunge, Pune, Maharashtra"
            maxLength={300}
            rows={2}
            required
          />
        </label>
        <label>
          Sport
          <input value={sport} onChange={(e) => setSport(e.target.value)} placeholder="Karate" maxLength={80} required />
        </label>
        <label>
          Recognition (optional)
          <input
            value={recognition}
            onChange={(e) => setRecognition(e.target.value)}
            placeholder="Official sponsor"
            maxLength={200}
          />
          <p className="form-hint">Gokaido’s role at the event, or an award / recognition received.</p>
        </label>
        <label>
          Hosted by (optional)
          <input
            value={hostedBy}
            onChange={(e) => setHostedBy(e.target.value)}
            placeholder="Indian Goju Ryu Karate Do Association"
            maxLength={200}
          />
        </label>
        <label>
          Display order
          <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          <p className="form-hint">Lower numbers appear first — the lowest is “01” on the Events page.</p>
        </label>
        <label>
          <span>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Show on website
          </span>
        </label>
      </div>

      <label>
        About the event
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={1200} rows={5} required />
        <p className="form-hint">
          Keep it to 2–4 sentences (around 300 characters) — phones show only the first three lines.
        </p>
      </label>

      <label>
        Photos
        <MultiImageUpload purpose="event" values={images} onChange={setImages} reorderable />
        <p className="form-hint">
          The first photo is the cover; the next two fan out behind it. Landscape (about 5:4) works best — photos
          are centre-cropped. Use ← to change the order.
        </p>
      </label>

      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : isEdit ? "Save changes" : "Create event"}
      </button>
    </form>
  );
}
