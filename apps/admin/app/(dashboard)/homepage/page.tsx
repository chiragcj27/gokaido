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
  trendingSearches: [],
  faqs: [],
  playStoreUrl: null,
  appStoreUrl: null,
  beyondTheMedalUrl: null,
};

// Older API builds don't return the newer fields — fill them in so the form never reads undefined.
const normalize = (s: Partial<HomepageSettings>): HomepageSettings => ({ ...EMPTY, ...s });

export default function HomepagePage() {
  const [settings, setSettings] = useState<HomepageSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // Edited as raw text so blank lines survive while typing; split on save.
  const [trendingText, setTrendingText] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ settings: HomepageSettings }>("/api/homepage-settings");
      const next = normalize(res.settings);
      setSettings(next);
      setTrendingText(next.trendingSearches.join("\n"));
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
        trendingSearches: trendingText
          .split("\n")
          .map((t) => t.trim())
          .filter(Boolean),
        // Half-filled rows are dropped rather than rejected by the API.
        faqs: settings.faqs
          .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }))
          .filter((f) => f.question && f.answer),
        playStoreUrl: settings.playStoreUrl?.trim() ?? "",
        appStoreUrl: settings.appStoreUrl?.trim() ?? "",
        beyondTheMedalUrl: settings.beyondTheMedalUrl?.trim() ?? "",
      });
      const next = normalize(res.settings);
      setSettings(next);
      setTrendingText(next.trendingSearches.join("\n"));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save homepage settings");
    } finally {
      setSaving(false);
    }
  }

  function setFaq(index: number, field: "question" | "answer", value: string) {
    set(
      "faqs",
      settings.faqs.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
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

        <label>
          Trending searches
          <textarea
            rows={6}
            value={trendingText}
            onChange={(e) => {
              setSaved(false);
              setTrendingText(e.target.value);
            }}
          />
          <p className="form-hint">
            One per line, up to 12. Shown as chips in the search modal and typed out in its placeholder. Leave
            empty to use the built-in defaults.
          </p>
        </label>

        <fieldset>
          <legend>Store FAQs</legend>
          <p className="form-hint">
            Shown on every product page, Best Sellers and Search. Leave empty to use the built-in defaults.
          </p>
          {settings.faqs.map((faq, i) => (
            <div key={i} className="form">
              <label>
                Question
                <input value={faq.question} onChange={(e) => setFaq(i, "question", e.target.value)} />
              </label>
              <label>
                Answer
                <textarea rows={3} value={faq.answer} onChange={(e) => setFaq(i, "answer", e.target.value)} />
              </label>
              <button
                type="button"
                onClick={() =>
                  set(
                    "faqs",
                    settings.faqs.filter((_, j) => j !== i),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set("faqs", [...settings.faqs, { question: "", answer: "" }])}>
            Add FAQ
          </button>
        </fieldset>

        <label>
          Play Store link
          <input
            type="url"
            value={settings.playStoreUrl ?? ""}
            onChange={(e) => set("playStoreUrl", e.target.value)}
          />
        </label>

        <label>
          App Store link
          <input
            type="url"
            value={settings.appStoreUrl ?? ""}
            onChange={(e) => set("appStoreUrl", e.target.value)}
          />
        </label>

        <label>
          &quot;Beyond the Medal&quot; button link
          <input
            type="url"
            value={settings.beyondTheMedalUrl ?? ""}
            onChange={(e) => set("beyondTheMedalUrl", e.target.value)}
          />
          <p className="form-hint">Any full link — a form, a WhatsApp link (https://wa.me/…) or mailto:.</p>
        </label>

        <button type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
