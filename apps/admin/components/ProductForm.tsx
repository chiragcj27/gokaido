"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Product, ProductVariant } from "../lib/types";

const SPORTS = ["karate", "taekwondo", "kickboxing", "boxing", "mma"];
const PRODUCT_TYPES = ["uniform", "equipment"];

interface Props {
  product: Product | null;
  onDone: () => void;
  onCancel: () => void;
}

type VariantDraft = { sku: string; color: string; size: string; stock: string; basePrice: string };

function toVariantDrafts(variants: ProductVariant[]): VariantDraft[] {
  if (variants.length === 0) return [{ sku: "", color: "", size: "", stock: "", basePrice: "" }];
  return variants.map((v) => ({
    sku: v.sku,
    color: v.color,
    size: v.size,
    stock: String(v.stock),
    basePrice: String(v.basePrice),
  }));
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProductForm({ product, onDone, onCancel }: Props) {
  const isEdit = product !== null;
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [sport, setSport] = useState(product?.sport ?? SPORTS[0]!);
  const [category, setCategory] = useState(product?.category ?? "");
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? "");
  const [productType, setProductType] = useState(product?.productType ?? PRODUCT_TYPES[0]!);
  const [description, setDescription] = useState(product?.description ?? "");
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isNewArrival, setIsNewArrival] = useState(product?.isNewArrival ?? false);
  const [isBestseller, setIsBestseller] = useState(product?.isBestseller ?? false);
  const [variants, setVariants] = useState<VariantDraft[]>(toVariantDrafts(product?.variants ?? []));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateVariant(index: number, field: keyof VariantDraft, value: string) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, [field]: value } : v)));
  }

  function addVariant() {
    setVariants((prev) => [...prev, { sku: "", color: "", size: "", stock: "", basePrice: "" }]);
  }

  function removeVariant(index: number) {
    setVariants((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      name,
      slug: slug || slugify(name),
      sport,
      category,
      subcategory: subcategory || undefined,
      productType,
      description,
      isFeatured,
      isNewArrival,
      isBestseller,
      variants: variants.map((v) => ({
        sku: v.sku,
        color: v.color,
        size: v.size,
        stock: Number(v.stock) || 0,
        basePrice: Number(v.basePrice) || 0,
      })),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/products/${product._id}`, payload);
      } else {
        await api.post("/api/products", payload);
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${product.name}` : "New product"}</h1>
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
          Sport
          <select value={sport} onChange={(e) => setSport(e.target.value)}>
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label>
          Product type
          <select value={productType} onChange={(e) => setProductType(e.target.value)}>
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Category
          <input value={category} onChange={(e) => setCategory(e.target.value)} required />
        </label>
        <label>
          Subcategory
          <input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} />
        </label>
      </div>

      <label className="full-width">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>

      <div className="checkbox-row">
        <label>
          <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
          Featured
        </label>
        <label>
          <input
            type="checkbox"
            checked={isNewArrival}
            onChange={(e) => setIsNewArrival(e.target.checked)}
          />
          New arrival
        </label>
        <label>
          <input
            type="checkbox"
            checked={isBestseller}
            onChange={(e) => setIsBestseller(e.target.checked)}
          />
          Bestseller
        </label>
      </div>

      <h2>Variants</h2>
      <div className="table-wrap">
        <table className="data-table variant-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Colour</th>
              <th>Size</th>
              <th>Stock</th>
              <th>Price (₹)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v, i) => (
              <tr key={i}>
                <td>
                  <input value={v.sku} onChange={(e) => updateVariant(i, "sku", e.target.value)} required />
                </td>
                <td>
                  <input
                    value={v.color}
                    onChange={(e) => updateVariant(i, "color", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input value={v.size} onChange={(e) => updateVariant(i, "size", e.target.value)} required />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => updateVariant(i, "stock", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={v.basePrice}
                    onChange={(e) => updateVariant(i, "basePrice", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <button type="button" className="link-button" onClick={() => removeVariant(i)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="link-button" onClick={addVariant}>
        + Add variant
      </button>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
