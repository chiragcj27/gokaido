"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Category, SizeGuide, Subcategory } from "../lib/types";
import ImageUpload from "./ImageUpload";
import SizeGuideFields from "./SizeGuideFields";

interface Props {
  subcategory: Subcategory | null;
  categories: Category[];
  onDone: () => void;
  onCancel: () => void;
}

const EMPTY_SIZE_GUIDE: SizeGuide = {
  title: "",
  description: "",
  measurementImage: "",
  measurementGuide: [],
  sizeChart: [],
  footerNote: "",
};

function buildSizeGuidePayload(sizeGuide: SizeGuide) {
  return {
    title: sizeGuide.title || undefined,
    description: sizeGuide.description || undefined,
    measurementImage: sizeGuide.measurementImage || undefined,
    measurementGuide: sizeGuide.measurementGuide,
    sizeChart: sizeGuide.sizeChart,
    footerNote: sizeGuide.footerNote || undefined,
  };
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
  const [icon, setIcon] = useState(subcategory?.icon ?? "");
  const [hasSizeGuide, setHasSizeGuide] = useState(Boolean(subcategory?.sizeGuide));
  const [sizeGuide, setSizeGuide] = useState<SizeGuide>(subcategory?.sizeGuide ?? EMPTY_SIZE_GUIDE);
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
      icon: icon || undefined,
      // null clears a previously-saved custom guide on edit (see
      // updateSubcategory) — on create there's nothing to clear yet.
      sizeGuide: hasSizeGuide ? buildSizeGuidePayload(sizeGuide) : isEdit ? null : undefined,
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

      <label className="full-width">
        Subcategory icon
        <small className="form-hint">Small preview shown under this subcategory in the collections page bar on hover.</small>
        <ImageUpload purpose="category" value={icon} onChange={setIcon} />
      </label>

      <h2>Size guide</h2>
      <small className="form-hint">
        Sizing is shared by every product under this subcategory. Leave this off and products here fall back to the
        storefront&apos;s default size guide.
      </small>
      <div className="checkbox-row">
        <label>
          <input type="checkbox" checked={hasSizeGuide} onChange={(e) => setHasSizeGuide(e.target.checked)} />
          Custom size guide for this subcategory
        </label>
      </div>

      {hasSizeGuide && <SizeGuideFields value={sizeGuide} onChange={setSizeGuide} />}

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create subcategory"}
        </button>
      </div>
    </form>
  );
}
