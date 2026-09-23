"use client";

import { useState } from "react";
import { uploadImage, ApiError } from "../lib/api";

// Mirrors ImageUpload — same presign flow, uploadImage works for any file
// (it just PUTs whatever's handed to it), only the accept type and preview
// element differ.
interface Props {
  purpose: string;
  value: string;
  onChange: (url: string) => void;
}

export default function VideoUpload({ purpose, value, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Soft warning only — the API doesn't cap size, but an uncompressed
    // export will hurt homepage load time. Compress before uploading.
    if (file.size > 5 * 1024 * 1024) {
      setError(
        `${(file.size / (1024 * 1024)).toFixed(1)}MB is large for a hero video — compress it first (aim for 1–2MB) or the homepage will load slowly.`
      );
    } else {
      setError(null);
    }

    setUploading(true);
    try {
      const { publicUrl } = await uploadImage(file, purpose);
      onChange(publicUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload video");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="image-upload">
      {value && (
        <video src={value} className="image-upload-preview" muted loop autoPlay playsInline controls />
      )}
      <input type="file" accept="video/mp4,video/webm" onChange={handleFile} disabled={uploading} />
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
