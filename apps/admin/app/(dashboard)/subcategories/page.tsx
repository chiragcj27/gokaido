"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Category, Subcategory } from "../../../lib/types";
import SubcategoryForm from "../../../components/SubcategoryForm";

function categoryLabel(category: Subcategory["category"]): string {
  return typeof category === "string" ? category : category.name;
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

  async function handleToggleActive(subcategory: Subcategory) {
    if (subcategory.isActive) {
      await api.delete(`/api/subcategories/${subcategory._id}`);
    } else {
      await api.patch(`/api/subcategories/${subcategory._id}`, { isActive: true });
    }
    load();
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
                <th>Category</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {subcategories.map((s) => (
                <tr key={s._id}>
                  <td>{s.image && <img src={s.image} alt="" className="thumb" />}</td>
                  <td>{s.name}</td>
                  <td className="mono">{s.slug}</td>
                  <td>{categoryLabel(s.category)}</td>
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
                  </td>
                </tr>
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
