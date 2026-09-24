"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Store } from "../../../lib/types";
import StoreForm from "../../../components/StoreForm";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Store | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ stores: Store[] }>("/api/stores/admin");
      setStores(res.stores);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load stores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(store: Store) {
    try {
      await api.patch(`/api/stores/${store._id}`, { isActive: !store.isActive });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update store");
    }
  }

  async function handleDelete(store: Store) {
    if (!window.confirm(`Delete ${store.name} (${store.city})? This can't be undone.`)) return;
    try {
      await api.delete(`/api/stores/${store._id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete store");
    }
  }

  if (editing) {
    return (
      <StoreForm
        store={editing === "new" ? null : editing}
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
        <h1>Stores</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New store
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
                <th>Order</th>
                <th>City</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s._id}>
                  <td className="mono">{s.sortOrder}</td>
                  <td>{s.city}</td>
                  <td>{s.name}</td>
                  <td className="mono">{s.phone ?? "—"}</td>
                  <td>
                    <span className={`pill ${s.isActive ? "pill-active" : "pill-inactive"}`}>
                      {s.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setEditing(s)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggleActive(s)}>
                      {s.isActive ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => handleDelete(s)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No stores yet.
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
