"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Product } from "../../../lib/types";

// Bestsellers are just products with `isBestseller: true` — this page is a
// shortcut for toggling that flag, the same one exposed on ProductForm and
// the bulk-upload `isBestseller` column.

const PAGE_SIZE = 100; // API max per page

async function fetchAllProducts(): Promise<Product[]> {
  const all: Product[] = [];
  for (let page = 1; ; page++) {
    const res = await api.get<{ products: Product[] }>(
      `/api/products?limit=${PAGE_SIZE}&page=${page}&sort=newest&status=all`
    );
    all.push(...res.products);
    if (res.products.length < PAGE_SIZE) return all;
  }
}

export default function BestsellersPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await fetchAllProducts());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const bestsellers = useMemo(() => products.filter((p) => p.isBestseller), [products]);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter(
      (p) =>
        !p.isBestseller &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.slug.includes(q) ||
          p.category.toLowerCase().includes(q))
    );
  }, [products, search]);

  async function setBestseller(product: Product, isBestseller: boolean) {
    setError(null);
    setSavingId(product._id);
    try {
      await api.patch(`/api/products/${product._id}`, { isBestseller });
      setProducts((prev) => prev.map((p) => (p._id === product._id ? { ...p, isBestseller } : p)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update product");
    } finally {
      setSavingId(null);
    }
  }

  function renderRow(p: Product, action: "add" | "remove") {
    const thumb = p.cardImage ?? p.images?.[0];
    return (
      <tr key={p._id}>
        <td>{thumb && <img src={thumb} alt="" className="thumb" />}</td>
        <td>{p.name}</td>
        <td>{p.sport}</td>
        <td>{p.category}</td>
        <td>
          <span className={`pill ${p.isActive ? "pill-active" : "pill-inactive"}`}>
            {p.isActive ? "Active" : "Inactive"}
          </span>
        </td>
        <td className="row-actions">
          <button
            type="button"
            onClick={() => setBestseller(p, action === "add")}
            disabled={savingId === p._id}
          >
            {savingId === p._id ? "Saving…" : action === "add" ? "Add" : "Remove"}
          </button>
        </td>
      </tr>
    );
  }

  const tableHead = (
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Sport</th>
        <th>Category</th>
        <th>Status</th>
        <th></th>
      </tr>
    </thead>
  );

  return (
    <div>
      <div className="page-header">
        <h1>Bestsellers</h1>
      </div>

      <p className="form-hint">
        Products marked as bestsellers. The same flag can be set from the product form, or with the{" "}
        <code>isBestseller</code> column (true/false) in bulk upload. Inactive products stay hidden
        on the storefront even if marked.
      </p>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <h2>Current bestsellers ({bestsellers.length})</h2>
          <div className="table-wrap">
            <table className="data-table">
              {tableHead}
              <tbody>
                {bestsellers.map((p) => renderRow(p, "remove"))}
                {bestsellers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      No bestsellers yet — add some below.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 style={{ marginTop: "2rem" }}>Add a bestseller</h2>
          <input
            type="search"
            placeholder="Search by name, slug or category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", maxWidth: "24rem", marginBottom: "1rem" }}
          />
          <div className="table-wrap">
            <table className="data-table">
              {tableHead}
              <tbody>
                {candidates.map((p) => renderRow(p, "add"))}
                {candidates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-row">
                      {search ? "No matching products." : "Every product is already a bestseller."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
