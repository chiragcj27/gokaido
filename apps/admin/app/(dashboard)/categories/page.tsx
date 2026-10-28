"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Category } from "../../../lib/types";
import CategoryForm from "../../../components/CategoryForm";
import PositionInput from "../../../components/PositionInput";
import { moveItem, useDragReorder } from "../../../lib/useDragReorder";

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

  async function saveOrder(next: Category[]) {
    setCategories(next.map((c, i) => ({ ...c, sortOrder: i + 1 })));
    setError(null);
    try {
      await api.put("/api/categories/order", { ids: next.map((c) => c._id) });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save order");
      load();
    }
  }

  const drag = useDragReorder((_group, from, to) => saveOrder(moveItem(categories, from, to)));

  async function handleToggleActive(category: Category) {
    if (category.isActive) {
      await api.delete(`/api/categories/${category._id}`);
    } else {
      await api.patch(`/api/categories/${category._id}`, { isActive: true });
    }
    load();
  }

  async function handleDelete(category: Category) {
    if (
      !window.confirm(
        `Permanently delete "${category.name}" and all its subcategories? This can't be undone.`,
      )
    )
      return;
    setError(null);
    try {
      await api.delete(`/api/categories/${category._id}?permanent=true`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete category");
    }
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
      <p className="form-hint">Drag ⠿ or type a number to change the order shown on the storefront.</p>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th></th>
                <th>Name</th>
                <th>Slug</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c._id} {...drag.rowProps("all", i)}>
                  <td>
                    <div className="position-cell">
                      <span className="drag-handle" title="Drag to reorder" {...drag.handleProps("all", i)}>
                        ⠿
                      </span>
                      <PositionInput
                        position={i + 1}
                        max={categories.length}
                        onChange={(to) => saveOrder(moveItem(categories, i, to - 1))}
                      />
                    </div>
                  </td>
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
                    <button type="button" className="btn-danger" onClick={() => handleDelete(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
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
