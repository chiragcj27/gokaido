"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Category } from "../../../lib/types";
import CategoryForm from "../../../components/CategoryForm";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ categories: Category[] }>("/api/categories?status=all");
      setCategories(res.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(category: Category) {
    if (category.isActive) {
      await api.delete(`/api/categories/${category._id}`);
    } else {
      await api.patch(`/api/categories/${category._id}`, { isActive: true });
    }
    load();
  }

  if (editing) {
    return (
      <CategoryForm
        category={editing === "new" ? null : editing}
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
        <h1>Categories</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New category
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
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td>{c.image && <img src={c.image} alt="" className="thumb" />}</td>
                  <td>{c.name}</td>
                  <td className="mono">{c.slug}</td>
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
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-row">
                    No categories yet.
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
