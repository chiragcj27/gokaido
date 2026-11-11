"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import type { BlogLanguage, BlogPost, Localized } from "../lib/types";
import ImageUpload from "./ImageUpload";
import BlogEditor from "./BlogEditor/BlogEditor";

interface Props {
  postId: string | null;
  onDone: () => void;
  onCancel: () => void;
}

const LANGUAGES: { code: BlogLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "mr", label: "मराठी" },
  { code: "ta", label: "தமிழ்" },
];

const STOREFRONT_URL = (process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);

/** ISO → value for <input type="datetime-local"> in the browser's local time. */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

const fill = (v?: Localized): Required<Localized> => ({ en: v?.en ?? "", hi: v?.hi ?? "", mr: v?.mr ?? "", ta: v?.ta ?? "" });

export default function BlogPostForm({ postId, onDone, onCancel }: Props) {
  const isEdit = postId !== null;
  const [loading, setLoading] = useState(isEdit);
  const [lang, setLang] = useState<BlogLanguage>("en");

  const [title, setTitle] = useState(fill());
  const [content, setContent] = useState(fill());
  const [excerpt, setExcerpt] = useState(fill());
  const [metaTitle, setMetaTitle] = useState(fill());
  const [metaDescription, setMetaDescription] = useState(fill());
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [featuredImage, setFeaturedImage] = useState("");
  const [author, setAuthor] = useState("Team Gokaido");
  const [tags, setTags] = useState("");
  const [sport, setSport] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState("");
  const [savedSlug, setSavedSlug] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!postId) return;
    api
      .get<{ post: BlogPost }>(`/api/blog-posts/admin/${postId}`)
      .then(({ post }) => {
        setTitle(fill(post.title));
        setContent(fill(post.content));
        setExcerpt(fill(post.excerpt));
        setMetaTitle(fill(post.metaTitle));
        setMetaDescription(fill(post.metaDescription));
        setSlug(post.slug);
        setSavedSlug(post.slug);
        setFeaturedImage(post.featuredImage ?? "");
        setAuthor(post.author);
        setTags(post.tags.join(", "));
        setSport(post.sport ?? "");
        setIsPublished(post.isPublished);
        setPublishedAt(toLocalInput(post.publishedAt));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load post"))
      .finally(() => setLoading(false));
  }, [postId]);

  // Warn before closing the tab with unsaved edits — a long post is a lot to lose.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const setLocalized =
    (setter: React.Dispatch<React.SetStateAction<Required<Localized>>>) => (value: string) => {
      setDirty(true);
      setter((prev) => ({ ...prev, [lang]: value }));
    };

  function handleTitle(value: string) {
    setLocalized(setTitle)(value);
    if (lang === "en" && !slugTouched) setSlug(slugify(value));
  }

  function handleCancel() {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    onCancel();
  }

  async function save(publish: boolean | null) {
    setError(null);
    if (!title.en.trim()) return setError("English title is required."), setLang("en");
    if (!content.en.trim()) return setError("English content is required."), setLang("en");
    if (!slug) return setError("Slug is required.");

    setSaving(true);
    const nextPublished = publish ?? isPublished;
    const payload = {
      slug,
      title,
      content,
      excerpt,
      metaTitle,
      metaDescription,
      featuredImage,
      author,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      sport,
      isPublished: nextPublished,
      publishedAt: publishedAt ? new Date(publishedAt).toISOString() : "",
    };
    try {
      if (isEdit) await api.patch(`/api/blog-posts/${postId}`, payload);
      else await api.post("/api/blog-posts", payload);
      setDirty(false);
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading…</p>;

  const scheduled = isPublished && publishedAt && new Date(publishedAt) > new Date();

  return (
    <form
      className="entity-form blog-form"
      onSubmit={(e) => {
        e.preventDefault();
        save(null);
      }}
    >
      <div className="page-header">
        <h1>{isEdit ? `Edit: ${title.en || slug}` : "New blog post"}</h1>
        <div className="row-actions">
          {savedSlug && isPublished && (
            <a href={`${STOREFRONT_URL}/blogs/${savedSlug}`} target="_blank" rel="noopener noreferrer">
              View on site ↗
            </a>
          )}
          <button type="button" className="link-button" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="lang-tabs" role="tablist" aria-label="Language">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            type="button"
            role="tab"
            aria-selected={lang === l.code}
            className={lang === l.code ? "is-active" : ""}
            onClick={() => setLang(l.code)}
          >
            {l.label}
            {l.code === "en" ? " *" : title[l.code] || content[l.code] ? " ✓" : ""}
          </button>
        ))}
      </div>
      {lang !== "en" && (
        <p className="form-hint">Leave a field blank to show the English version to {LANGUAGES.find((l) => l.code === lang)?.label} readers.</p>
      )}

      <label className="full-width">
        Title{lang === "en" && " *"}
        <input value={title[lang]} onChange={(e) => handleTitle(e.target.value)} maxLength={200} />
      </label>

      <div className="full-width">
        <span className="field-label">Content{lang === "en" && " *"}</span>
        {/* Keyed by language: each language gets its own editor instance and undo history. */}
        <BlogEditor key={lang} value={content[lang]} onChange={setLocalized(setContent)} />
      </div>

      <label className="full-width">
        Excerpt
        <textarea value={excerpt[lang]} onChange={(e) => setLocalized(setExcerpt)(e.target.value)} maxLength={500} rows={2} />
        <p className="form-hint">Short summary, used as the search/social description when no meta description is set.</p>
      </label>

      <h2>SEO</h2>
      <div className="form-grid">
        <label>
          Meta title
          <input value={metaTitle[lang]} onChange={(e) => setLocalized(setMetaTitle)(e.target.value)} maxLength={120} />
          <p className="form-hint">{metaTitle[lang].length}/60 recommended. Defaults to the title.</p>
        </label>
        <label>
          Meta description
          <textarea
            value={metaDescription[lang]}
            onChange={(e) => setLocalized(setMetaDescription)(e.target.value)}
            maxLength={320}
            rows={3}
          />
          <p className="form-hint">{metaDescription[lang].length}/160 recommended.</p>
        </label>
      </div>

      <h2>Post settings</h2>
      <div className="form-grid">
        <label>
          URL slug *
          <input
            value={slug}
            onChange={(e) => {
              setDirty(true);
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            maxLength={120}
          />
          <p className="form-hint">/blogs/{slug || "…"} — changing it on a published post breaks existing links.</p>
        </label>
        <label>
          Author *
          <input value={author} onChange={(e) => (setDirty(true), setAuthor(e.target.value))} maxLength={80} />
        </label>
        <label>
          Tags
          <input
            value={tags}
            onChange={(e) => (setDirty(true), setTags(e.target.value))}
            placeholder="karate, training, news"
          />
          <p className="form-hint">Comma-separated.</p>
        </label>
        <label>
          Sport
          <select value={sport} onChange={(e) => (setDirty(true), setSport(e.target.value))}>
            <option value="">—</option>
            <option value="karate">Karate</option>
            <option value="boxing">Boxing</option>
            <option value="taekwondo">Taekwondo</option>
          </select>
        </label>
        <label>
          Publish date
          <input
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => (setDirty(true), setPublishedAt(e.target.value))}
          />
          <p className="form-hint">
            Shown on the post. Blank = the moment you publish. A future date schedules it — it stays hidden until then.
          </p>
        </label>
        <label>
          Status
          <span>
            <span className={`pill ${isPublished ? (scheduled ? "pill-warning" : "pill-active") : "pill-inactive"}`}>
              {isPublished ? (scheduled ? "Scheduled" : "Published") : "Draft"}
            </span>
          </span>
        </label>
      </div>

      <label className="full-width">
        Cover image
        <ImageUpload purpose="blog" value={featuredImage} onChange={(v) => (setDirty(true), setFeaturedImage(v))} />
        <p className="form-hint">
          Landscape, at least 1600px wide. Shown on the blog listing (cropped to fill) and at the top of the post.
        </p>
      </label>

      <div className="form-actions">
        {isPublished ? (
          <>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" disabled={saving} onClick={() => save(false)}>
              Unpublish (back to draft)
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={saving} onClick={() => save(false)}>
              {saving ? "Saving…" : "Save draft"}
            </button>
            <button type="submit" disabled={saving} onClick={(e) => (e.preventDefault(), save(true))}>
              {saving ? "Saving…" : publishedAt && new Date(publishedAt) > new Date() ? "Schedule" : "Publish"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
