"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { Reel } from "../../../lib/types";
import ReelForm from "../../../components/ReelForm";

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Reel | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ reels: Reel[] }>("/api/reels/admin");
      setReels(res.reels);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleToggleActive(reel: Reel) {
    try {
      await api.patch(`/api/reels/${reel._id}`, { isActive: !reel.isActive });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update reel");
    }
  }

  async function handleDelete(reel: Reel) {
    if (!window.confirm(`Delete "${reel.title}"? This can't be undone.`)) return;
    try {
      await api.delete(`/api/reels/${reel._id}`);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete reel");
    }
  }

  if (editing) {
    return (
      <ReelForm
        reel={editing === "new" ? null : editing}
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
        <h1>Reels</h1>
        <button type="button" onClick={() => setEditing("new")}>
          New reel
        </button>
      </div>
      <p className="form-hint">Shown in the homepage &quot;See it in action&quot; carousel, three at a time.</p>

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Preview</th>
                <th>Title</th>
                <th>Instagram</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reels.map((r) => (
                <tr key={r._id}>
                  <td className="mono">{r.sortOrder}</td>
                  <td>
                    {r.videoUrl ? (
                      <video
                        src={r.videoUrl}
                        poster={r.posterUrl}
                        muted
                        playsInline
                        preload="metadata"
                        style={{ width: 48, height: 84, objectFit: "cover", borderRadius: 4 }}
                      />
                    ) : (
                      "Instagram embed"
                    )}
                  </td>
                  <td>{r.title}</td>
                  <td>
                    {r.instagramUrl ? (
                      <a href={r.instagramUrl} target="_blank" rel="noopener noreferrer">
                        Open
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <span className={`pill ${r.isActive ? "pill-active" : "pill-inactive"}`}>
                      {r.isActive ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button type="button" onClick={() => setEditing(r)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleToggleActive(r)}>
                      {r.isActive ? "Hide" : "Show"}
                    </button>
                    <button type="button" onClick={() => handleDelete(r)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {reels.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    No reels yet.
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
