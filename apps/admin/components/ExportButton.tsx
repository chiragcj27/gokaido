"use client";

import { useState } from "react";
import { ApiError, downloadFile } from "../lib/api";

// Downloads `path` (an admin `/export` endpoint, already carrying the page's
// current filters) as an .xlsx file.
export default function ExportButton({ path, fileName }: { path: string; fileName: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setBusy(true);
    setError(null);
    try {
      await downloadFile(path, fileName);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="export-button">
      <button type="button" onClick={handleClick} disabled={busy}>
        {busy ? "Preparing…" : "Download Excel"}
      </button>
      {error && <span className="form-error">{error}</span>}
    </span>
  );
}
