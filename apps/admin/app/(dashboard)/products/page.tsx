"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Product } from "../../../lib/types";
import ProductForm from "../../../components/ProductForm";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ products: Product[] }>(
        "/api/products?limit=100&sort=newest&status=all"
      );
      setProducts(res.products);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(product: Product) {
    if (product.isActive) {
      await api.delete(`/api/products/${product._id}`);
    } else {
      await api.patch(`/api/products/${product._id}`, { isActive: true });
    }
    load();
  }

  if (editing) {
    return (
      <ProductForm
        product={editing === "new" ? null : editing}
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
        <h1>Products</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New product
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
                <th>Name</th>
                <th>Sport</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.sport}</td>
                  <td>{p.category}</td>
                  <td className="mono">{p.variants.length}</td>
                  <td>
                    <span className={`pill ${p.isActive ? "pill-active" : "pill-inactive"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setEditing(p)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggleActive(p)}>
                      {p.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No products yet.
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
