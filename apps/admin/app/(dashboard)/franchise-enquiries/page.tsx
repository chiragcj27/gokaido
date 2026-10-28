"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { FranchiseEnquiry, FranchiseEnquiryStatus } from "../../../lib/types";
import { useDebounced } from "../../../lib/useDebounced";
import ExportButton from "../../../components/ExportButton";
import DateRangeFilter, { type DateRange } from "../../../components/DateRangeFilter";

const STATUS_OPTIONS: FranchiseEnquiryStatus[] = ["new", "contacted", "closed"];

// Labels for the storefront form's "How did you hear about us?" values.
const SOURCE_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  google: "Google search",
  store: "Gokaido store",
  referral: "Friend / referral",
  other: "Other",
};

export default function FranchiseEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<FranchiseEnquiry[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<FranchiseEnquiryStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState<DateRange>({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const debouncedSearch = useDebounced(search.trim());

  // Shared by the list request and the Excel export so the download matches
  // what's on screen (minus pagination).
  const filterParams = useMemo(() => {
    const params = new URLSearchParams({ status });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (dates.from) params.set("from", dates.from);
    if (dates.to) params.set("to", dates.to);
    return params.toString();
  }, [status, debouncedSearch, dates]);

  // Drop responses from superseded requests (fast typing in search).
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await api.get<{
        enquiries: FranchiseEnquiry[];
        newCount: number;
        pagination: { total: number; totalPages: number };
      }>(`/api/admin/franchise-enquiries?page=${page}&limit=20&${filterParams}`);
      if (requestId !== requestIdRef.current) return;
      setEnquiries(res.enquiries);
      setNewCount(res.newCount);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages || 1);
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof ApiError ? err.message : "Failed to load enquiries");
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

  async function update(enquiry: FranchiseEnquiry, body: { status?: FranchiseEnquiryStatus; adminNotes?: string }) {
    try {
      const res = await api.patch<{ enquiry: FranchiseEnquiry }>(`/api/admin/franchise-enquiries/${enquiry._id}`, body);
      setEnquiries((prev) => prev.map((e) => (e._id === enquiry._id ? res.enquiry : e)));
      if (body.status && body.status !== enquiry.status) {
        setNewCount((n) => n + (body.status === "new" ? 1 : 0) - (enquiry.status === "new" ? 1 : 0));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update enquiry");
    }
  }

  function editNotes(enquiry: FranchiseEnquiry) {
    const notes = window.prompt("Internal notes for this enquiry:", enquiry.adminNotes ?? "");
    if (notes === null) return;
    update(enquiry, { adminNotes: notes });
  }

  return (
    <div>
      <div className="page-header">
        <h1>
          Franchise enquiries{" "}
          {newCount > 0 && <span className="pill pill-warning">{newCount} new</span>}
        </h1>
        <ExportButton
          path={`/api/admin/franchise-enquiries/export?${filterParams}`}
          fileName="franchise-enquiries.xlsx"
        />
      </div>

      <div className="filter-bar">
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as FranchiseEnquiryStatus | "all")}>
            <option value="all">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-grow">
          Search (name, email, phone, city or business)
          <input value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>
      <DateRangeFilter value={dates} onChange={setDates} />

      {error && <p className="form-error">{error}</p>}

      <p className="result-count">{loading ? "Loading…" : `${total} enquir${total === 1 ? "y" : "ies"}`}</p>

      <div className={`table-wrap ${loading ? "is-loading" : ""}`}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Received</th>
              <th>Name</th>
              <th>City / country</th>
              <th>Business</th>
              <th>Heard via</th>
              <th>Message</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {enquiries.map((e) => (
              <tr key={e._id}>
                <td>{new Date(e.createdAt).toLocaleString()}</td>
                <td>
                  <strong>{e.name}</strong>
                  <div>
                    <a href={`mailto:${e.email}`}>{e.email}</a>
                  </div>
                  {/* Older enquiries predate the phone/city fields. */}
                  {e.phone && (
                    <div>
                      <a href={`tel:${e.phone.replace(/[^\d+]/g, "")}`}>{e.phone}</a>
                    </div>
                  )}
                </td>
                <td>{e.city || "—"}</td>
                <td>{e.businessName}</td>
                <td>{e.source ? (SOURCE_LABELS[e.source] ?? e.source) : "—"}</td>
                <td style={{ whiteSpace: "pre-wrap", maxWidth: 360 }}>
                  {e.message || "—"}
                  {e.adminNotes && (
                    <div style={{ marginTop: "0.5rem", color: "var(--text-muted)" }}>
                      <strong>Notes:</strong> {e.adminNotes}
                    </div>
                  )}
                </td>
                <td>
                  <select
                    aria-label="Status"
                    style={{ width: "auto", minWidth: "7.5rem" }}
                    value={e.status}
                    onChange={(ev) => update(e, { status: ev.target.value as FranchiseEnquiryStatus })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="row-actions">
                  <button type="button" onClick={() => editNotes(e)}>
                    {e.adminNotes ? "Edit notes" : "Add notes"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && enquiries.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  No enquiries found.
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
