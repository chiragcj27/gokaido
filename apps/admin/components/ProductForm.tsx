"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Category, Color, Product, ProductVariant, Subcategory } from "../lib/types";
import MultiImageUpload from "./MultiImageUpload";
import ImageUpload from "./ImageUpload";

const SPORTS = ["karate", "taekwondo", "kickboxing", "boxing", "mma"];
const PRODUCT_TYPES = ["uniform", "equipment"];

interface Props {
  product: Product | null;
  onDone: () => void;
  onCancel: () => void;
}

type SizeRowDraft = {
  sku: string;
  size: string;
  stock: string;
  basePrice: string;
};

type ColorGroupDraft = {
  color: string;
  images: string[];
  sizes: SizeRowDraft[];
};

// Photos live per colour, not per size — the variant schema stores images on
// every size-variant, but a colour's sizes always share the same photo set,
// so we group by colour here and copy the group's images onto each size row
// on submit instead of asking staff to re-upload the same photos per size.
function toColorGroups(variants: ProductVariant[]): ColorGroupDraft[] {
  if (variants.length === 0)
    return [{ color: "", images: [], sizes: [{ sku: "", size: "", stock: "", basePrice: "" }] }];

  const groups: ColorGroupDraft[] = [];
  const indexByColor = new Map<string, number>();
  for (const v of variants) {
    let index = indexByColor.get(v.color);
    if (index === undefined) {
      index = groups.length;
      indexByColor.set(v.color, index);
      groups.push({ color: v.color, images: v.images ?? [], sizes: [] });
    }
    const group = groups[index]!;
    if (group.images.length === 0 && v.images?.length) group.images = v.images;
    group.sizes.push({
      sku: v.sku,
      size: v.size,
      stock: String(v.stock),
      basePrice: String(v.basePrice),
    });
  }
  return groups;
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
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [cardImage, setCardImage] = useState(product?.cardImage ?? "");
  const [competitorImage, setCompetitorImage] = useState(product?.competitorImage ?? "");
  const [colorGroups, setColorGroups] = useState<ColorGroupDraft[]>(
    toColorGroups(product?.variants ?? [])
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [colors, setColors] = useState<Color[]>([]);

  useEffect(() => {
    api
      .get<{ categories: Category[] }>("/api/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    api
      .get<{ colors: Color[] }>("/api/colors")
      .then((res) => setColors(res.colors))
      .catch(() => setColors([]));
  }, []);

  function hexForColor(name: string): string | undefined {
    return colors.find((c) => c.name.trim().toLowerCase() === name.trim().toLowerCase())?.hex;
  }

  useEffect(() => {
    const selected = categories.find((c) => c.slug === category);
    if (!selected) {
      setSubcategories([]);
      return;
    }
    api
      .get<{ subcategories: Subcategory[] }>(`/api/subcategories?category=${selected._id}`)
      .then((res) => setSubcategories(res.subcategories))
      .catch(() => setSubcategories([]));
  }, [category, categories]);

  function updateColorName(groupIndex: number, value: string) {
    setColorGroups((prev) =>
      prev.map((g, i) => (i === groupIndex ? { ...g, color: value } : g))
    );
  }

  function updateColorImages(groupIndex: number, urls: string[]) {
    setColorGroups((prev) => prev.map((g, i) => (i === groupIndex ? { ...g, images: urls } : g)));
  }

  function addColorGroup() {
    setColorGroups((prev) => [
      ...prev,
      { color: "", images: [], sizes: [{ sku: "", size: "", stock: "", basePrice: "" }] },
    ]);
  }

  function removeColorGroup(groupIndex: number) {
    setColorGroups((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== groupIndex) : prev));
  }

  function updateSizeRow(
    groupIndex: number,
    sizeIndex: number,
    field: keyof SizeRowDraft,
    value: string
  ) {
    setColorGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, sizes: g.sizes.map((s, j) => (j === sizeIndex ? { ...s, [field]: value } : s)) }
          : g
      )
    );
  }

  function addSizeRow(groupIndex: number) {
    setColorGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex
          ? { ...g, sizes: [...g.sizes, { sku: "", size: "", stock: "", basePrice: "" }] }
          : g
      )
    );
  }

  function removeSizeRow(groupIndex: number, sizeIndex: number) {
    setColorGroups((prev) =>
      prev.map((g, i) =>
        i === groupIndex && g.sizes.length > 1
          ? { ...g, sizes: g.sizes.filter((_, j) => j !== sizeIndex) }
          : g
      )
    );
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
      images,
      cardImage: cardImage || undefined,
      competitorImage: competitorImage || undefined,
      isFeatured,
      isNewArrival,
      isBestseller,
      variants: colorGroups.flatMap((g) =>
        g.sizes.map((s) => ({
          sku: s.sku,
          color: g.color,
          size: s.size,
          stock: Number(s.stock) || 0,
          basePrice: Number(s.basePrice) || 0,
          images: g.images,
        }))
      ),
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
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subcategory
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={subcategories.length === 0}
          >
            <option value="">None</option>
            {subcategories.map((s) => (
              <option key={s._id} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="full-width">
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>

      <label className="full-width">
        Images
        <MultiImageUpload purpose="product" values={images} onChange={setImages} />
      </label>

      <div className="form-grid">
        <label>
          Card image
          <small className="form-hint">
            Background-removed cutout only — used for product cards/listings. Regular images above
            may have a background.
          </small>
          <ImageUpload purpose="product" value={cardImage} onChange={setCardImage} />
        </label>
        <label>
          Competitor image
          <small className="form-hint">
            A competitor's product photo, shown on the "before" side of the protection comparison
            slider.
          </small>
          <ImageUpload purpose="product" value={competitorImage} onChange={setCompetitorImage} />
        </label>
      </div>

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

      <h2>Colours &amp; sizes</h2>
      <small className="form-hint">
        <strong>SKU:</strong> {"{PRODUCT CODE}-{COLOUR}-{SIZE}"}, e.g. {slug ? slug.toUpperCase().slice(0, 6) : "KG1"}
        -RED-M. Must be unique across the whole catalogue and never changed once the product is live — Google
        Shopping uses it as the listing&apos;s permanent ID, so editing it later makes Google treat the item as
        brand new and it loses its listing history.
        <br />
        <strong>Size:</strong> type exactly what should appear on the storefront&apos;s size selector (S, M, L, XL,
        or a number). Keep spelling identical across every colour of this product.
        <br />
        <strong>Stock:</strong> units available for this exact colour + size. If it&apos;s temporarily unavailable,
        set stock to 0 rather than deleting the row — deleting drops it from the Google Shopping feed entirely
        instead of just marking it out of stock.
        <br />
        <strong>Price (₹):</strong> the base/national selling price for this SKU. Region-specific price overrides
        aren&apos;t editable here yet.
      </small>
      {colorGroups.map((group, groupIndex) => (
        <div className="color-group" key={groupIndex}>
          <div className="color-group-header">
            <label>
              Colour
              <div className="color-swatch-picker">
                {group.color && (
                  <span
                    className="color-swatch"
                    style={{ backgroundColor: hexForColor(group.color) ?? "transparent" }}
                    title={hexForColor(group.color) ? undefined : "No swatch colour set for this name"}
                  />
                )}
                <select
                  value={group.color}
                  onChange={(e) => updateColorName(groupIndex, e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a colour
                  </option>
                  {group.color && !hexForColor(group.color) && (
                    <option value={group.color}>{group.color} (not in Colors list)</option>
                  )}
                  {colors.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            {colorGroups.length > 1 && (
              <button
                type="button"
                className="link-button"
                onClick={() => removeColorGroup(groupIndex)}
              >
                Remove colour
              </button>
            )}
          </div>

          <label className="full-width">
            Photos for this colour
            <MultiImageUpload
              purpose="product"
              values={group.images}
              onChange={(urls) => updateColorImages(groupIndex, urls)}
            />
          </label>

          <div className="table-wrap">
            <table className="data-table variant-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Size</th>
                  <th>Stock</th>
                  <th>Price (₹)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {group.sizes.map((row, sizeIndex) => (
                  <tr key={sizeIndex}>
                    <td>
                      <input
                        value={row.sku}
                        onChange={(e) => updateSizeRow(groupIndex, sizeIndex, "sku", e.target.value)}
                        placeholder={`e.g. ${(slug || "PRODUCTCODE").toUpperCase().slice(0, 6)}-${(
                          group.color || "COLOUR"
                        ).toUpperCase()}-M`}
                        required
                      />
                    </td>
                    <td>
                      <input
                        value={row.size}
                        onChange={(e) => updateSizeRow(groupIndex, sizeIndex, "size", e.target.value)}
                        placeholder="e.g. M"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={row.stock}
                        onChange={(e) => updateSizeRow(groupIndex, sizeIndex, "stock", e.target.value)}
                        placeholder="e.g. 25"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.basePrice}
                        onChange={(e) =>
                          updateSizeRow(groupIndex, sizeIndex, "basePrice", e.target.value)
                        }
                        placeholder="e.g. 999"
                        required
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => removeSizeRow(groupIndex, sizeIndex)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="link-button" onClick={() => addSizeRow(groupIndex)}>
            + Add size
          </button>
        </div>
      ))}
      <button type="button" className="link-button" onClick={addColorGroup}>
        + Add colour
      </button>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
