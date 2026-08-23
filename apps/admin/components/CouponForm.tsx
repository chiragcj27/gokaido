"use client";

import { useState } from "react";
import { api, ApiError } from "../lib/api";
import type { Coupon } from "../lib/types";

interface Props {
  coupon: Coupon | null;
  onDone: () => void;
  onCancel: () => void;
}

function toDateInputValue(iso?: string): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export default function CouponForm({ coupon, onDone, onCancel }: Props) {
  const isEdit = coupon !== null;
  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<"percentage" | "fixed">(coupon?.type ?? "percentage");
  const [value, setValue] = useState(coupon ? String(coupon.value) : "");
  const [minOrderValue, setMinOrderValue] = useState(coupon ? String(coupon.minOrderValue) : "0");
  const [maxDiscount, setMaxDiscount] = useState(
    coupon?.maxDiscount != null ? String(coupon.maxDiscount) : ""
  );
  const [usageLimit, setUsageLimit] = useState(
    coupon?.usageLimit != null ? String(coupon.usageLimit) : ""
  );
  const [perUserLimit, setPerUserLimit] = useState(coupon ? String(coupon.perUserLimit) : "1");
  const [validFrom, setValidFrom] = useState(
    toDateInputValue(coupon?.validFrom) || new Date().toISOString().slice(0, 10)
  );
  const [validUntil, setValidUntil] = useState(toDateInputValue(coupon?.validUntil));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const sharedPayload = {
      type,
      value: Number(value),
      minOrderValue: Number(minOrderValue) || 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      usageLimit: usageLimit ? Number(usageLimit) : undefined,
      perUserLimit: Number(perUserLimit) || 1,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
    };

    try {
      if (isEdit) {
        await api.patch(`/api/coupons/${coupon._id}`, sharedPayload);
      } else {
        await api.post("/api/coupons", { code, ...sharedPayload });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="entity-form" onSubmit={handleSubmit}>
      <div className="page-header">
        <h1>{isEdit ? `Edit ${coupon.code}` : "New coupon"}</h1>
        <button type="button" className="link-button" onClick={onCancel}>
          Cancel
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-grid">
        <label>
          Code
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            disabled={isEdit}
            required
          />
        </label>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value as "percentage" | "fixed")}>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </label>
        <label>
          Value {type === "percentage" ? "(%)" : "(₹)"}
          <input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} required />
        </label>
        <label>
          Min order value (₹)
          <input
            type="number"
            min="0"
            value={minOrderValue}
            onChange={(e) => setMinOrderValue(e.target.value)}
          />
        </label>
        <label>
          Max discount (₹, optional)
          <input type="number" min="0" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)} />
        </label>
        <label>
          Usage limit (optional)
          <input type="number" min="1" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
        </label>
        <label>
          Per-user limit
          <input
            type="number"
            min="1"
            value={perUserLimit}
            onChange={(e) => setPerUserLimit(e.target.value)}
          />
        </label>
        <label>
          Valid from
          <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} required />
        </label>
        <label>
          Valid until
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} required />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
