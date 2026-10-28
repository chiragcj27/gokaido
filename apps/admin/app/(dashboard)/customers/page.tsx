"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Customer } from "../../../lib/types";
import { useDebounced } from "../../../lib/useDebounced";
import ExportButton from "../../../components/ExportButton";
import DateRangeFilter, { type DateRange } from "../../../components/DateRangeFilter";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const day = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("en-IN") : "—");

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dates, setDates] = useState<DateRange>({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounced(search.trim());

  const filterParams = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (dates.from) params.set("from", dates.from);
    if (dates.to) params.set("to", dates.to);
    return params.toString();
  }, [debouncedSearch, dates]);

  // Drop responses from superseded requests (fast typing in search).
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await api.get<{ customers: Customer[]; pagination: { total: number; totalPages: number } }>(
        `/api/admin/customers?page=${page}&limit=20${filterParams ? `&${filterParams}` : ""}`
      );
      if (requestId !== requestIdRef.current) return;
      setCustomers(res.customers);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages || 1);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof ApiError ? err.message : "Failed to load customers");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [page, filterParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filterParams]);

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <ExportButton path={`/api/admin/customers/export?${filterParams}`} fileName="customers.xlsx" />
      </div>

      <div className="filter-bar">
        <label className="filter-grow">
          Search (name, mobile or email)
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>
      <DateRangeFilter value={dates} onChange={setDates} />
      <p className="form-hint">Date range filters on signup date. Orders and spend count paid orders only.</p>

      {error && <p className="form-error">{error}</p>}

      <p className="result-count">{loading ? "Loading…" : `${total} customer${total === 1 ? "" : "s"}`}</p>

      <div className={`table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Region</th>
              <th>Orders</th>
              <th>Spent</th>
              <th>Last order</th>
              <th>Points</th>
              <th>Signed up</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c._id}>
                <td>
                  <strong>{c.name || "—"}</strong>
                  <div className="cell-sub">
                    {c.mobile}
                    {c.email ? ` · ${c.email}` : ""}
                  </div>
                </td>
                <td>{c.region || "—"}</td>
                <td className="mono">{c.orders}</td>
                <td className="mono">{inr(c.spent)}</td>
                <td>{day(c.lastOrderAt)}</td>
                <td className="mono">{c.rewardPoints}</td>
                <td>{day(c.createdAt)}</td>
                <td className="row-actions">
                  {c.mobile && (
                    <Link className="button-link" href={`/orders?search=${encodeURIComponent(c.mobile)}`}>
                      Orders
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {!loading && customers.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No customers found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
