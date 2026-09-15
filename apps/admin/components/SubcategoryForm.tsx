"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Category, Subcategory } from "../lib/types";
import ImageUpload from "./ImageUpload";

interface Props {
  subcategory: Subcategory | null;
  categories: Category[];
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

function categoryId(category: Subcategory["category"]): string {
  return typeof category === "string" ? category : category._id;
}

export default function SubcategoryForm({ subcategory, categories, onDone, onCancel }: Props) {
  const isEdit = subcategory !== null;
  const [name, setName] = useState(subcategory?.name ?? "");
  const [slug, setSlug] = useState(subcategory?.slug ?? "");
  const [categoryValue, setCategoryValue] = useState(
    subcategory ? categoryId(subcategory.category) : (categories[0]?._id ?? "")
  );
  const [description, setDescription] = useState(subcategory?.description ?? "");
  const [image, setImage] = useState(subcategory?.image ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryValue) {
      setError("Select a category first — create one if none exist yet.");
      return;
    }

    const payload = {
      name,
      slug: slug || slugify(name),
      category: categoryValue,
      description: description || undefined,
      image: image || undefined,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/subcategories/${subcategory._id}`, payload);
      } else {
        await api.post("/api/subcategories", payload);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save subcategory");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${subcategory.name}` : "New subcategory"}</h1>
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
          Category
          <select value={categoryValue} onChange={(e) => setCategoryValue(e.target.value)} required>
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
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
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create subcategory"}
        </button>
      </div>
    </form>
  );
}
