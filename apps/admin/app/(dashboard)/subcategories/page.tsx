"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Category, Subcategory } from "../../../lib/types";
import SubcategoryForm from "../../../components/SubcategoryForm";
import PositionInput from "../../../components/PositionInput";
import { moveItem, useDragReorder } from "../../../lib/useDragReorder";

function categoryId(category: Subcategory["category"]): string {
  return typeof category === "string" ? category : category._id;
}

export default function SubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Subcategory | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subcategoriesRes, categoriesRes] = await Promise.all([
        api.get<{ subcategories: Subcategory[] }>("/api/subcategories?status=all"),
        api.get<{ categories: Category[] }>("/api/categories?status=all"),
      ]);
      setSubcategories(subcategoriesRes.subcategories);
      setCategories(categoriesRes.categories);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load subcategories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Order is per category, so the table is grouped by category (in the
  // categories' own order) and drags/positions stay within a group.
  const groups = categories
    .map((category) => ({
      category,
      items: subcategories.filter((s) => categoryId(s.category) === category._id),
    }))
    .filter((g) => g.items.length > 0);

  async function saveOrder(categoryKey: string, next: Subcategory[]) {
    setSubcategories((prev) => [
      ...prev.filter((s) => categoryId(s.category) !== categoryKey),
      ...next.map((s, i) => ({ ...s, sortOrder: i + 1 })),
    ]);
    setError(null);
    try {
      await api.put("/api/subcategories/order", {
        ids: next.map((s) => s._id),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save order");
      load();
    }
  }

  function moveWithin(categoryKey: string, from: number, to: number) {
    const items = groups.find((g) => g.category._id === categoryKey)?.items ?? [];
    saveOrder(categoryKey, moveItem(items, from, to));
  }

  const drag = useDragReorder(moveWithin);

  async function handleToggleActive(subcategory: Subcategory) {
    if (subcategory.isActive) {
      await api.delete(`/api/subcategories/${subcategory._id}`);
    } else {
      await api.patch(`/api/subcategories/${subcategory._id}`, {
        isActive: true,
      });
    }
    load();
  }

  async function handleDelete(subcategory: Subcategory) {
    if (!window.confirm(`Permanently delete "${subcategory.name}"? This can't be undone.`)) return;
    setError(null);
    try {
      await api.delete(`/api/subcategories/${subcategory._id}?permanent=true`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete subcategory");
    }
  }

  if (editing) {
    return (
      <SubcategoryForm
        subcategory={editing === "new" ? null : editing}
        categories={categories.filter((c) => c.isActive)}
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
        <h1>Subcategories</h1>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={categories.filter((c) => c.isActive).length === 0}
        >
          New subcategory
        </button>
      </div>

      {categories.length === 0 && !loading && (
        <p className="form-error">Create a category first before adding subcategories.</p>
      )}

      {error && <p className="form-error">{error}</p>}
      <p className="form-hint">
        Drag ⠿ or type a number to change the order within each category on the storefront.
      </p>

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
              {groups.map(({ category, items }) => (
                <Fragment key={category._id}>
                  <tr className="group-row">
                    <td colSpan={6}>
                      {category.name}
                      {!category.isActive && <span className="pill pill-inactive">Inactive</span>}
                    </td>
                  </tr>
                  {items.map((s, i) => (
                    <tr key={s._id} {...drag.rowProps(category._id, i)}>
                      <td>
                        <div className="position-cell">
                          <span
                            className="drag-handle"
                            title="Drag to reorder"
                            {...drag.handleProps(category._id, i)}
                          >
                            ⠿
                          </span>
                          <PositionInput
                            position={i + 1}
                            max={items.length}
                            onChange={(to) => moveWithin(category._id, i, to - 1)}
                          />
                        </div>
                      </td>
                      <td>{s.image && <img src={s.image} alt="" className="thumb" />}</td>
                      <td>{s.name}</td>
                      <td className="mono">{s.slug}</td>
                      <td>
                        <span className={`pill ${s.isActive ? "pill-active" : "pill-inactive"}`}>
                          {s.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="row-actions">
                        <button type="button" onClick={() => setEditing(s)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleToggleActive(s)}>
                          {s.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => handleDelete(s)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {subcategories.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No subcategories yet.
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
