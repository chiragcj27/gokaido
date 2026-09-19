"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Color } from "../../../lib/types";
import ColorForm from "../../../components/ColorForm";

export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Color | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ colors: Color[] }>("/api/colors?status=all");
      setColors(res.colors);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load colors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(color: Color) {
    if (color.isActive) {
      await api.delete(`/api/colors/${color._id}`);
    } else {
      await api.patch(`/api/colors/${color._id}`, { isActive: true });
    }
    load();
  }

  if (editing) {
    return (
      <ColorForm
        color={editing === "new" ? null : editing}
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
        <h1>Colors</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New color
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
                <th></th>
                <th>Name</th>
                <th>Slug</th>
                <th>Hex</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {colors.map((c) => (
                <tr key={c._id}>
                  <td>
                    <span className="color-swatch" style={{ backgroundColor: c.hex }} />
                  </td>
                  <td>{c.name}</td>
                  <td className="mono">{c.slug}</td>
                  <td className="mono">{c.hex}</td>
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
              {colors.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No colors yet.
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
