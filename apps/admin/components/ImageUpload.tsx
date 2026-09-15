"use client";

import { useState } from "react";
import { uploadImage, ApiError } from "../lib/api";

interface Props {
  purpose: string;
  value: string;
  onChange: (url: string) => void;
}

export default function ImageUpload({ purpose, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const { publicUrl } = await uploadImage(file, purpose);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-upload">
      {value && <img src={value} alt="" className="image-upload-preview" />}
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={uploading} />
      {uploading && <span>Uploading…</span>}
      {value && (
        <button type="button" className="link-button" onClick={() => onChange("")}>
          Remove
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
