"use client";

import { useState } from "react";
import { uploadImage, ApiError } from "../lib/api";

interface Props {
  purpose: string;
  values: string[];
  onChange: (urls: string[]) => void;
  compact?: boolean;
}

export default function MultiImageUpload({ purpose, values, onChange, compact }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setError(null);
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadImage(file, purpose)));
      onChange([...values, ...uploaded.map((u) => u.publicUrl)]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className={`image-upload ${compact ? "image-upload-compact" : ""}`}>
      {values.map((url, i) => (
        <div key={url} className="image-upload-item">
          <img src={url} alt="" className={compact ? "thumb" : "image-upload-preview"} />
          <button type="button" className="link-button" onClick={() => removeAt(i)}>
            ×
          </button>
        </div>
      ))}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        onChange={handleFiles}
        disabled={uploading}
      />
      {uploading && <span>Uploading…</span>}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
