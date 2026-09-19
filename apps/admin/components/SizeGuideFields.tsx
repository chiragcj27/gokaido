"use client";

import ImageUpload from "./ImageUpload";
import type { SizeGuide, SizeGuideMeasurementPoint, SizeGuideRow } from "../lib/types";

interface Props {
  value: SizeGuide;
  onChange: (value: SizeGuide) => void;
}

export default function SizeGuideFields({ value, onChange }: Props) {
  function set<K extends keyof SizeGuide>(key: K, next: SizeGuide[K]) {
    onChange({ ...value, [key]: next });
  }

  function updatePoint(index: number, field: keyof SizeGuideMeasurementPoint, next: string) {
    set(
      "measurementGuide",
      value.measurementGuide.map((point, i) => (i === index ? { ...point, [field]: next } : point))
    );
  }

  function addPoint() {
    set("measurementGuide", [...value.measurementGuide, { letter: "", title: "", description: "" }]);
  }

  function removePoint(index: number) {
    set(
      "measurementGuide",
      value.measurementGuide.filter((_, i) => i !== index)
    );
  }

  function updateRow(index: number, field: keyof SizeGuideRow, next: string) {
    set(
      "sizeChart",
      value.sizeChart.map((row, i) =>
        i === index ? { ...row, [field]: field === "size" ? next : Number(next) || 0 } : row
      )
    );
  }

  function addRow() {
    set("sizeChart", [...value.sizeChart, { size: "", chestMinCm: 0, chestMaxCm: 0, lengthCm: 0 }]);
  }

  function removeRow(index: number) {
    set(
      "sizeChart",
      value.sizeChart.filter((_, i) => i !== index)
    );
  }

  return (
    <div className="color-group">
      <label className="full-width">
        Size guide title
        <input value={value.title ?? ""} onChange={(e) => set("title", e.target.value)} placeholder="Size Guide" />
      </label>

      <label className="full-width">
        Size guide subtitle
        <textarea
          value={value.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          placeholder="Find your perfect fit with our detailed size guide."
        />
      </label>

      <label className="full-width">
        How-to-measure diagram
        <small className="form-hint">
          Falls back to the storefront&apos;s default mannequin diagram when left empty.
        </small>
        <ImageUpload
          purpose="sizeGuide"
          value={value.measurementImage ?? ""}
          onChange={(url) => set("measurementImage", url || undefined)}
        />
      </label>

      <h3>Measurement points</h3>
      <small className="form-hint">
        The lettered badges (A, B, …) shown on the diagram, each with the instruction shown beside it.
      </small>
      <div className="table-wrap">
        <table className="data-table variant-table">
          <thead>
            <tr>
              <th>Badge</th>
              <th>Title</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {value.measurementGuide.map((point, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={point.letter}
                    onChange={(e) => updatePoint(index, "letter", e.target.value)}
                    placeholder="A"
                    maxLength={4}
                    required
                  />
                </td>
                <td>
                  <input
                    value={point.title}
                    onChange={(e) => updatePoint(index, "title", e.target.value)}
                    placeholder="Chest Circumference"
                    required
                  />
                </td>
                <td>
                  <input
                    value={point.description}
                    onChange={(e) => updatePoint(index, "description", e.target.value)}
                    placeholder="Measure around the fullest part of your chest."
                    required
                  />
                </td>
                <td>
                  <button type="button" className="link-button" onClick={() => removePoint(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {value.measurementGuide.length === 0 && (
              <tr>
                <td colSpan={4} className="empty-row">
                  No measurement points yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="link-button" onClick={addPoint}>
        + Add measurement point
      </button>

      <h3>Size chart</h3>
      <small className="form-hint">
        <strong>Size:</strong> must match the size spelling used on this subcategory&apos;s products exactly (S, M,
        L, XL, or a number) — the storefront disables any size in the chart that a product doesn&apos;t actually
        offer.
      </small>
      <div className="table-wrap">
        <table className="data-table variant-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest min (cm)</th>
              <th>Chest max (cm)</th>
              <th>Length (cm)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {value.sizeChart.map((row, index) => (
              <tr key={index}>
                <td>
                  <input
                    value={row.size}
                    onChange={(e) => updateRow(index, "size", e.target.value)}
                    placeholder="M"
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.chestMinCm}
                    onChange={(e) => updateRow(index, "chestMinCm", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.chestMaxCm}
                    onChange={(e) => updateRow(index, "chestMaxCm", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={row.lengthCm}
                    onChange={(e) => updateRow(index, "lengthCm", e.target.value)}
                    required
                  />
                </td>
                <td>
                  <button type="button" className="link-button" onClick={() => removeRow(index)}>
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {value.sizeChart.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-row">
                  No size rows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <button type="button" className="link-button" onClick={addRow}>
        + Add size row
      </button>

      <label className="full-width">
        Footer note
        <textarea
          value={value.footerNote ?? ""}
          onChange={(e) => set("footerNote", e.target.value)}
          rows={2}
          placeholder="Sizes are approximate and may vary slightly by product."
        />
      </label>
    </div>
  );
}
