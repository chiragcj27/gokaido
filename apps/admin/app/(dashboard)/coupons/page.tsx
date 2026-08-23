"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Coupon } from "../../../lib/types";
import CouponForm from "../../../components/CouponForm";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ coupons: Coupon[] }>("/api/coupons?limit=100");
      setCoupons(res.coupons);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(coupon: Coupon) {
    if (coupon.isActive) {
      await api.delete(`/api/coupons/${coupon._id}`);
    } else {
      await api.patch(`/api/coupons/${coupon._id}`, { isActive: true });
    }
    load();
  }

  if (editing) {
    return (
      <CouponForm
        coupon={editing === "new" ? null : editing}
        onDone={() => {
          setEditing(null);
          load();
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Coupons</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New coupon
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min order</th>
                <th>Usage</th>
                <th>Valid until</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td className="mono">{c.code}</td>
                  <td className="mono">
                    {c.type === "percentage" ? `${c.value}%` : `₹${c.value}`}
                    {c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ""}
                  </td>
                  <td className="mono">₹{c.minOrderValue}</td>
                  <td className="mono">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td>{new Date(c.validUntil).toLocaleDateString()}</td>
                  <td>
                    <span className={`pill ${c.isActive ? "pill-active" : "pill-inactive"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggleActive(c)}>
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-row">
                    No coupons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
