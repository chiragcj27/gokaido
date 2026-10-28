"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Category } from "../lib/types";
import ImageUpload from "./ImageUpload";

interface Props {
  category: Category | null;
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

export default function CategoryForm({ category, onDone, onCancel }: Props) {
  const isEdit = category !== null;
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [sortOrder, setSortOrder] = useState(category ? String(category.sortOrder) : "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      description: description || undefined,
      image: image || undefined,
      // Blank on create appends to the end (see the create controller).
      sortOrder: sortOrder === "" ? undefined : Number(sortOrder),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/categories/${category._id}`, payload);
      } else {
        await api.post("/api/categories", payload);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${category.name}` : "New category"}</h1>
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
        <label>
          Display order
          <input type="number" min="0" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
          <p className="form-hint">Lower numbers appear first. Leave blank to add at the end.</p>
        </label>
      </div>

      <label className="full-width">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

      <label className="full-width">
        Image
        <ImageUpload purpose="category" value={image} onChange={setImage} />
      </label>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create category"}
        </button>
      </div>
    </form>
  );
}
