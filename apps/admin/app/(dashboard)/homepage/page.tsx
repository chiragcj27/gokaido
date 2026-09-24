"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../../../lib/api";
import type { HomepageSettings } from "../../../lib/types";
import ImageUpload from "../../../components/ImageUpload";
import MultiImageUpload from "../../../components/MultiImageUpload";
import VideoUpload from "../../../components/VideoUpload";

const EMPTY: HomepageSettings = {
  heroVideoUrl: null,
  heroVideoPosterUrl: null,
  heroBackgroundImageUrl: null,
  heroShowcaseImages: [],
};

export default function HomepagePage() {
  const [settings, setSettings] = useState<HomepageSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ settings: HomepageSettings }>("/api/homepage-settings");
      setSettings(res.settings);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load homepage settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) {
    setSaved(false);
    setSettings((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      // "" (cleared) is sent explicitly so the API unsets the field —
      // null is only ever a read-side value, never posted back.
      const res = await api.patch<{ settings: HomepageSettings }>("/api/homepage-settings", {
        heroVideoUrl: settings.heroVideoUrl ?? "",
        heroVideoPosterUrl: settings.heroVideoPosterUrl ?? "",
        heroBackgroundImageUrl: settings.heroBackgroundImageUrl ?? "",
        heroShowcaseImages: settings.heroShowcaseImages ?? [],
      });
      setSettings(res.settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save homepage settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <div className="page-header">
        <h1>Homepage</h1>
      </div>

      {error && <p className="form-error">{error}</p>}
      {saved && <p className="form-success">Saved.</p>}

      <div className="form">
        <label>
          Hero video
          <VideoUpload purpose="homepage" value={settings.heroVideoUrl ?? ""} onChange={(v) => set("heroVideoUrl", v)} />
          <p className="form-hint">
            Plays muted/looped in the small slot, then grows full-screen on scroll — muted by default because
            browsers block autoplay with sound, but visitors can unmute it with the speaker button. Include audio if
            you want, and compress to ~1–2MB; large files slow down the homepage either way.
          </p>
        </label>

        <label>
          Hero video poster
          <ImageUpload
            purpose="homepage"
            value={settings.heroVideoPosterUrl ?? ""}
            onChange={(v) => set("heroVideoPosterUrl", v)}
          />
          <p className="form-hint">Still frame shown before the video loads (and on mobile fallback).</p>
        </label>

        <label>
          Hero background
          <ImageUpload
            purpose="homepage"
            value={settings.heroBackgroundImageUrl ?? ""}
            onChange={(v) => set("heroBackgroundImageUrl", v)}
          />
          <p className="form-hint">Full-bleed background behind the hero headline and video slot.</p>
        </label>

        <label>
          Hero product showcase
          <MultiImageUpload
            purpose="homepage"
            values={settings.heroShowcaseImages ?? []}
            onChange={(v) => set("heroShowcaseImages", v)}
            compact
          />
          <p className="form-hint">
            Product tiles in the white card between &quot;MADE&quot; and &quot;TO&quot;, shown left to right in
            upload order. Up to 3; use square images — they&apos;re cropped to squares.
          </p>
        </label>

        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
