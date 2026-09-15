"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, downloadBulkTemplate, uploadProductsBulk } from "../../../lib/api";
import type { BulkUploadResult, Product } from "../../../lib/types";
import ProductForm from "../../../components/ProductForm";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleDownloadTemplate() {
    setBulkError(null);
    try {
      const blob = await downloadBulkTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "product-bulk-upload-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBulkError(err instanceof ApiError ? err.message : "Failed to download template");
    }
  }

  async function handleBulkFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBulkError(null);
    setBulkResult(null);
    setBulkUploading(true);
    try {
      const result = await uploadProductsBulk<BulkUploadResult>(file);
      setBulkResult(result);
      load();
    } catch (err) {
      setBulkError(err instanceof ApiError ? err.message : "Bulk upload failed");
    } finally {
      setBulkUploading(false);
    }
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

      <div className="panel">
        <h2>Bulk upload</h2>
        <p className="form-hint">
          One row per SKU/variant, grouped into a product by matching <code>slug</code>.{" "}
          <code>category</code>/<code>subcategory</code> must match a name already created under
          Categories/Subcategories (not case-sensitive) — get exact URLs for the{" "}
          <code>images</code>/<code>variantImages</code> columns from the{" "}
          <a href="/assets">Asset store</a>. Existing slugs are skipped, never overwritten.
        </p>
        <div className="row-actions">
          <button type="button" className="link-button" onClick={handleDownloadTemplate}>
            Download template
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkUploading}
          >
            {bulkUploading ? "Uploading…" : "Upload spreadsheet"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleBulkFile}
            hidden
          />
        </div>

        {bulkError && <p className="form-error">{bulkError}</p>}

        {bulkResult && (
          <div style={{ marginTop: "1rem" }}>
            <p>
              <span className="pill pill-active">{bulkResult.created.length} created</span>{" "}
              <span className="pill pill-warning">{bulkResult.skipped.length} skipped</span>{" "}
              <span className="pill pill-danger">{bulkResult.errors.length} errors</span>
            </p>
            {bulkResult.skipped.length > 0 && (
              <ul>
                {bulkResult.skipped.map((s) => (
                  <li key={s.slug}>
                    <span className="mono">{s.slug}</span> — {s.reason}
                  </li>
                ))}
              </ul>
            )}
            {bulkResult.errors.length > 0 && (
              <ul>
                {bulkResult.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
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
                  <td>{p.images?.[0] && <img src={p.images[0]} alt="" className="thumb" />}</td>
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
                  <td colSpan={7} className="empty-row">
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
