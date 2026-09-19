"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Color } from "../lib/types";

interface Props {
  color: Color | null;
  onDone: () => void;
  onCancel: () => void;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ColorForm({ color, onDone, onCancel }: Props) {
  const isEdit = color !== null;
  const [name, setName] = useState(color?.name ?? "");
  const [slug, setSlug] = useState(color?.slug ?? "");
  const [hex, setHex] = useState(color?.hex ?? "#dc2626");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      hex,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/colors/${color._id}`, payload);
      } else {
        await api.post("/api/colors", payload);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save color");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${color.name}` : "New color"}</h1>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Slug
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={slugify(name) || "auto-generated from name"}
          />
        </label>
      </div>

      <label>
        Swatch color
        <div className="color-swatch-picker">
          <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} />
          <input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#DC2626"
            pattern="^#[0-9a-fA-F]{6}$"
            required
            className="mono"
          />
        </div>
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create color"}
        </button>
      </div>
    </form>
  );
}
