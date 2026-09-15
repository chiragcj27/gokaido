"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError, uploadImage } from "../../../lib/api";
import type { Asset } from "../../../lib/types";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const query = q ? `?search=${encodeURIComponent(q)}` : "";
      const res = await api.get<{ assets: Asset[] }>(`/api/assets${query}`);
      setAssets(res.assets);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(search);
  }, [load, search]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!name.trim()) {
      setError("Give this asset a name tag before uploading");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { publicUrl, key } = await uploadImage(file, "asset");
      await api.post("/api/assets", {
        name: name.trim(),
        url: publicUrl,
        key,
        contentType: file.type,
      });
      setName("");
      load(search);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload asset");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(asset: Asset) {
    await api.delete(`/api/assets/${asset._id}`);
    load(search);
  }

  async function handleCopy(asset: Asset) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset._id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Clipboard API unavailable — the URL is still visible in the table to copy manually.
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Asset store</h1>
      </div>

      <p className="form-hint">
        Upload an image, tag it with a name, and copy its S3 URL — paste that URL into the{" "}
        <code>images</code>/<code>variantImages</code> columns of the product bulk-upload
        spreadsheet instead of re-uploading the same file there.
      </p>

      {error && <p className="form-error">{error}</p>}

      <div className="panel">
        <label>
          Name tag
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Karate Gi Red Front"
          />
        </label>
        <div style={{ marginTop: "0.75rem" }}>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading && <span> Uploading…</span>}
        </div>
      </div>

      <div className="form-grid" style={{ marginBottom: "1rem" }}>
        <label>
          Search by name
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…" />
        </label>
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
                <th>URL</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a._id}>
                  <td>
                    <img src={a.url} alt="" className="thumb" />
                  </td>
                  <td>{a.name}</td>
                  <td className="mono">{a.url}</td>
                  <td className="row-actions">
                    <button type="button" onClick={() => handleCopy(a)}>
                      {copiedId === a._id ? "Copied!" : "Copy URL"}
                    </button>
                    <button type="button" onClick={() => handleDelete(a)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-row">
                    No assets yet.
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
