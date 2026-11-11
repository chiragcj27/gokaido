"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { BlogPostListItem } from "../../../lib/types";
import BlogPostForm from "../../../components/BlogPostForm";
import { useDebounced } from "../../../lib/useDebounced";

type Status = "" | "published" | "draft" | "scheduled";

function statusOf(p: BlogPostListItem): { label: string; cls: string } {
  if (!p.isPublished) return { label: "Draft", cls: "pill-inactive" };
  if (p.publishedAt && new Date(p.publishedAt) > new Date()) return { label: "Scheduled", cls: "pill-warning" };
  return { label: "Published", cls: "pill-active" };
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "—";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<Status>("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page: String(page), limit: "25" });
      if (status) qs.set("status", status);
      if (debouncedSearch.trim()) qs.set("search", debouncedSearch.trim());
      const res = await api.get<{ posts: BlogPostListItem[]; totalPages: number }>(`/api/blog-posts/admin?${qs}`);
      setPosts(res.posts);
      setTotalPages(Math.max(1, res.totalPages));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(p: BlogPostListItem) {
    if (!window.confirm(`Delete “${p.title.en ?? p.slug}”? This can't be undone.`)) return;
    try {
      await api.delete(`/api/blog-posts/${p._id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete post");
    }
  }

  async function handleTogglePublish(p: BlogPostListItem) {
    try {
      await api.patch(`/api/blog-posts/${p._id}`, { isPublished: !p.isPublished });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update post");
    }
  }

  if (editing) {
    return (
      <BlogPostForm
        postId={editing === "new" ? null : editing}
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
        <h1>Blog</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New post
        </button>
      </div>

      <div className="filter-bar">
        <label className="filter-grow">
          Search
          <input
          type="search"
          placeholder="Search title, slug or author"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        </label>
        <label>
          Status
          <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as Status);
            setPage(1);
          }}
        >
          <option value="">All</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="draft">Drafts</option>
        </select>
        </label>
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
                <th>Title</th>
                <th>Author</th>
                <th>Publish date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => {
                const st = statusOf(p);
                return (
                  <tr key={p._id}>
                    <td>{p.featuredImage ? <img src={p.featuredImage} alt="" className="thumb" /> : null}</td>
                    <td>
                      {p.title.en ?? "(untitled)"}
                      <div className="form-hint mono">/blogs/{p.slug}</div>
                    </td>
                    <td>{p.author}</td>
                    <td>{fmtDate(p.publishedAt)}</td>
                    <td>
                      <span className={`pill ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="row-actions">
                      <button type="button" onClick={() => setEditing(p._id)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleTogglePublish(p)}>
                        {p.isPublished ? "Unpublish" : "Publish"}
                      </button>
                      <button type="button" className="btn-danger" onClick={() => handleDelete(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

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
