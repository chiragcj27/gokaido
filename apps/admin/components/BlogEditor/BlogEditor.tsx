"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BackgroundColor, Color, FontFamily, FontSize, LineHeight, TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { ApiError, uploadImage } from "../../lib/api";
import { BLOG_CONTENT_CSS } from "./blogContentCss";
import { BlogImage, FontWeight, type ImageAlign } from "./extensions";

interface Props {
  value: string;
  onChange: (html: string) => void;
}

type Mode = "visual" | "html";

// Fonts the storefront actually loads (apps/web/app/fonts.ts), referenced by CSS variable because
// next/font gives them hashed family names. The admin layout loads them under the same variables.
const FONT_FAMILIES = [
  { label: "Body (Roboto)", value: "" },
  { label: "Heading (Montserrat)", value: "var(--font-montserrat)" },
  { label: "Serif", value: "Georgia, serif" },
  { label: "Monospace", value: "ui-monospace, monospace" },
];
const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px", "64px", "80px"];
const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Regular", value: "400" },
  { label: "Medium", value: "500" },
  { label: "Semibold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Extra bold", value: "800" },
  { label: "Black", value: "900" },
];
const LINE_HEIGHTS = ["1", "1.2", "1.5", "1.7", "2"];
const BRAND_SWATCHES = ["#f5f5f5", "#f0ad3d", "#c8102e", "#9a9a9a", "#050505"];

/**
 * Markup the visual editor can't represent (layout wrappers, figures). Posts containing it open in
 * HTML mode, because round-tripping through the visual editor would silently drop that markup.
 */
const COMPLEX_MARKUP = /<(section|figure|figcaption|colgroup)\b|<div(?![^>]*data-youtube-video)/i;

export default function BlogEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<Mode>(() => (COMPLEX_MARKUP.test(value) ? "html" : "visual"));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextStyle,
      Color,
      BackgroundColor,
      FontFamily,
      FontSize,
      LineHeight,
      FontWeight,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      BlogImage,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder: "Start writing your post…" }),
    ],
    content: mode === "visual" ? value : "",
    editorProps: { attributes: { class: "blog-content rte-canvas" } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  function switchMode(next: Mode) {
    if (next === mode || !editor) return;
    if (next === "visual") {
      if (
        COMPLEX_MARKUP.test(value) &&
        !window.confirm(
          "This HTML contains layout markup (divs, sections, figures) the visual editor can't keep. " +
            "Switching will remove it. Continue?",
        )
      )
        return;
      editor.commands.setContent(value, { emitUpdate: true });
    }
    setMode(next);
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { publicUrl } = await uploadImage(file, "blog");
      const alt = window.prompt("Describe the image (alt text, for SEO and screen readers):", "") ?? "";
      if (mode === "html") insertIntoSource(`<img src="${publicUrl}" alt="${escapeAttr(alt)}" />`);
      else editor?.chain().focus().setImage({ src: publicUrl, alt }).run();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  // Inserts at the textarea's cursor (or the end), keeping the cursor after the inserted markup.
  function insertIntoSource(snippet: string) {
    const el = sourceRef.current;
    const at = el ? el.selectionEnd : value.length;
    const next = value.slice(0, at) + snippet + value.slice(at);
    onChange(next);
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      el.selectionStart = el.selectionEnd = at + snippet.length;
    });
  }

  return (
    <div className="rte">
      <style>{BLOG_CONTENT_CSS}</style>

      <div className="rte-modebar">
        <div className="rte-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "visual"}
            className={mode === "visual" ? "is-active" : ""}
            onClick={() => switchMode("visual")}
          >
            Visual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "html"}
            className={mode === "html" ? "is-active" : ""}
            onClick={() => switchMode("html")}
          >
            HTML
          </button>
        </div>
        {uploading && <span className="form-hint">Uploading image…</span>}
      </div>

      {error && <p className="form-error">{error}</p>}

      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleImageFile} />

      {mode === "visual" && editor && (
        <Toolbar editor={editor} onPickImage={() => fileInput.current?.click()} uploading={uploading} />
      )}
      {/* Kept mounted in HTML mode (just hidden) so the editor instance and its history survive. */}
      <div className="rte-stage" hidden={mode !== "visual"}>
        <EditorContent editor={editor} />
      </div>
      {mode === "html" && (
        <HtmlMode
          value={value}
          onChange={onChange}
          sourceRef={sourceRef}
          onPickImage={() => fileInput.current?.click()}
          uploading={uploading}
        />
      )}
    </div>
  );
}

/* ── Visual-mode toolbar ─────────────────────────────────────────────────── */

function Toolbar({ editor, onPickImage, uploading }: { editor: Editor; onPickImage: () => void; uploading: boolean }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => {
      const ts = e.getAttributes("textStyle");
      return {
        block: e.isActive("heading", { level: 1 })
          ? "h1"
          : e.isActive("heading", { level: 2 })
            ? "h2"
            : e.isActive("heading", { level: 3 })
              ? "h3"
              : e.isActive("heading", { level: 4 })
                ? "h4"
                : e.isActive("codeBlock")
                  ? "code"
                  : "p",
        fontFamily: (ts.fontFamily as string) ?? "",
        fontSize: (ts.fontSize as string) ?? "",
        fontWeight: (ts.fontWeight as string) ?? "",
        lineHeight: (ts.lineHeight as string) ?? "",
        color: (ts.color as string) ?? "",
        bg: (ts.backgroundColor as string) ?? "",
        bold: e.isActive("bold"),
        italic: e.isActive("italic"),
        underline: e.isActive("underline"),
        strike: e.isActive("strike"),
        code: e.isActive("code"),
        link: e.isActive("link"),
        bullet: e.isActive("bulletList"),
        ordered: e.isActive("orderedList"),
        quote: e.isActive("blockquote"),
        align: (["left", "center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
        image: e.isActive("image"),
        imageAlign: (e.getAttributes("image").align as ImageAlign | null) ?? null,
        table: e.isActive("table"),
        canUndo: e.can().undo(),
        canRedo: e.can().redo(),
      };
    },
  });

  const chain = () => editor.chain().focus();

  function setBlock(v: string) {
    if (v === "p") chain().setParagraph().run();
    else if (v === "code") chain().toggleCodeBlock().run();
    else chain().setHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 | 4 }).run();
  }

  function editLink() {
    const prev = (editor.getAttributes("link").href as string) ?? "";
    const url = window.prompt("Link URL (leave empty to remove the link):", prev);
    if (url === null) return;
    if (url.trim() === "") {
      chain().extendMarkRange("link").unsetLink().run();
      return;
    }
    const href = url.trim();
    // Links to our own pages stay in the tab; anything external opens a new one.
    const external = /^https?:\/\//i.test(href);
    chain()
      .extendMarkRange("link")
      .setLink({ href, target: external ? "_blank" : null })
      .run();
  }

  function insertImageUrl() {
    const src = window.prompt("Image URL (https://…):", "");
    if (!src?.trim()) return;
    const alt = window.prompt("Alt text:", "") ?? "";
    chain().setImage({ src: src.trim(), alt }).run();
  }

  function insertYoutube() {
    const src = window.prompt("YouTube video URL:", "");
    if (!src?.trim()) return;
    if (!chain().setYoutubeVideo({ src: src.trim() }).run()) window.alert("That doesn't look like a YouTube URL.");
  }

  function editAlt() {
    const prev = (editor.getAttributes("image").alt as string) ?? "";
    const alt = window.prompt("Alt text:", prev);
    if (alt !== null) chain().updateAttributes("image", { alt }).run();
  }

  return (
    <div className="rte-toolbar">
      <div className="rte-group">
        <Btn label="Undo" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
          ↶
        </Btn>
        <Btn label="Redo" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
          ↷
        </Btn>
      </div>

      <div className="rte-group">
        <select className="rte-select" value={s.block} onChange={(e) => setBlock(e.target.value)} aria-label="Block type">
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
          <option value="code">Code block</option>
        </select>
        <select
          className="rte-select"
          value={s.fontFamily}
          onChange={(e) => (e.target.value ? chain().setFontFamily(e.target.value).run() : chain().unsetFontFamily().run())}
          aria-label="Font"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <select
          className="rte-select rte-select-sm"
          value={s.fontSize}
          onChange={(e) => (e.target.value ? chain().setFontSize(e.target.value).run() : chain().unsetFontSize().run())}
          aria-label="Font size"
        >
          <option value="">Size</option>
          {FONT_SIZES.map((v) => (
            <option key={v} value={v}>
              {v.replace("px", "")}
            </option>
          ))}
        </select>
        <select
          className="rte-select"
          value={s.fontWeight}
          onChange={(e) =>
            e.target.value ? chain().setFontWeight(e.target.value).run() : chain().unsetFontWeight().run()
          }
          aria-label="Font weight"
        >
          <option value="">Weight</option>
          {FONT_WEIGHTS.map((w) => (
            <option key={w.value} value={w.value}>
              {w.label} ({w.value})
            </option>
          ))}
        </select>
        <select
          className="rte-select rte-select-sm"
          value={s.lineHeight}
          onChange={(e) =>
            e.target.value ? chain().setLineHeight(e.target.value).run() : chain().unsetLineHeight().run()
          }
          aria-label="Line height"
        >
          <option value="">Line</option>
          {LINE_HEIGHTS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="rte-group">
        <Btn label="Bold" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn label="Italic" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <i>I</i>
        </Btn>
        <Btn label="Underline" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <u>U</u>
        </Btn>
        <Btn label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <s>S</s>
        </Btn>
        <Btn label="Inline code" active={s.code} onClick={() => chain().toggleCode().run()}>
          {"</>"}
        </Btn>
      </div>

      <div className="rte-group">
        <ColorPicker
          label="Text colour"
          glyph="A"
          value={s.color}
          onPick={(c) => chain().setColor(c).run()}
          onClear={() => chain().unsetColor().run()}
        />
        <ColorPicker
          label="Highlight"
          glyph="▇"
          value={s.bg}
          onPick={(c) => chain().setBackgroundColor(c).run()}
          onClear={() => chain().unsetBackgroundColor().run()}
        />
        <Btn label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          ⌫
        </Btn>
      </div>

      <div className="rte-group">
        {(["left", "center", "right", "justify"] as const).map((a) => (
          <Btn key={a} label={`Align ${a}`} active={s.align === a} onClick={() => chain().setTextAlign(a).run()}>
            {{ left: "⇤", center: "↔", right: "⇥", justify: "≡" }[a]}
          </Btn>
        ))}
      </div>

      <div className="rte-group">
        <Btn label="Bullet list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
          •
        </Btn>
        <Btn label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
          1.
        </Btn>
        <Btn label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
          ❝
        </Btn>
        <Btn label="Divider" onClick={() => chain().setHorizontalRule().run()}>
          ―
        </Btn>
      </div>

      <div className="rte-group">
        <Btn label="Link" active={s.link} onClick={editLink}>
          🔗
        </Btn>
        <Btn label="Upload image" onClick={onPickImage} disabled={uploading}>
          🖼
        </Btn>
        <Btn label="Image from URL" onClick={insertImageUrl}>
          🖼URL
        </Btn>
        <Btn label="YouTube video" onClick={insertYoutube}>
          ▶
        </Btn>
        <Btn label="Table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          ▦
        </Btn>
      </div>

      {s.image && (
        <div className="rte-group rte-context">
          <span className="rte-context-label">Image</span>
          {(["left", "center", "right", "full"] as const).map((a) => (
            <Btn
              key={a}
              label={`Image ${a}`}
              active={s.imageAlign === a}
              onClick={() => chain().updateAttributes("image", { align: s.imageAlign === a ? null : a }).run()}
            >
              {{ left: "◧", center: "▣", right: "◨", full: "▭" }[a]}
            </Btn>
          ))}
          <Btn label="Edit alt text" onClick={editAlt}>
            Alt
          </Btn>
          <Btn
            label="Reset size"
            onClick={() => chain().updateAttributes("image", { width: null, height: null }).run()}
          >
            1:1
          </Btn>
        </div>
      )}

      {s.table && (
        <div className="rte-group rte-context">
          <span className="rte-context-label">Table</span>
          <Btn label="Add row" onClick={() => chain().addRowAfter().run()}>
            +Row
          </Btn>
          <Btn label="Add column" onClick={() => chain().addColumnAfter().run()}>
            +Col
          </Btn>
          <Btn label="Delete row" onClick={() => chain().deleteRow().run()}>
            −Row
          </Btn>
          <Btn label="Delete column" onClick={() => chain().deleteColumn().run()}>
            −Col
          </Btn>
          <Btn label="Toggle header row" onClick={() => chain().toggleHeaderRow().run()}>
            Header
          </Btn>
          <Btn label="Delete table" onClick={() => chain().deleteTable().run()}>
            ✕
          </Btn>
        </div>
      )}
    </div>
  );
}

function Btn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rte-btn${active ? " is-active" : ""}`}
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor's selection: a mousedown on the button would otherwise blur it first.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ColorPicker({
  label,
  glyph,
  value,
  onPick,
  onClear,
}: {
  label: string;
  glyph: string;
  value: string;
  onPick: (c: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rte-color">
      <button
        type="button"
        className="rte-btn"
        title={label}
        aria-label={label}
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ borderBottom: `3px solid ${value || "currentColor"}` }}>{glyph}</span>
      </button>
      {open && (
        <div className="rte-color-pop" onMouseDown={(e) => e.target instanceof HTMLInputElement || e.preventDefault()}>
          <div className="rte-swatches">
            {BRAND_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                className="rte-swatch"
                style={{ background: c }}
                title={c}
                aria-label={c}
                onClick={() => {
                  onPick(c);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <label className="rte-color-custom">
            Custom
            <input type="color" value={value.startsWith("#") ? value : "#f5f5f5"} onChange={(e) => onPick(e.target.value)} />
          </label>
          <button
            type="button"
            className="link-button"
            onClick={() => {
              onClear();
              setOpen(false);
            }}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

/* ── HTML mode: raw source + live preview ────────────────────────────────── */

const PREVIEW_FONTS =
  "https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700;900&display=swap";

function previewDoc(html: string) {
  // Sandboxed (no scripts), so pasted markup can't run anything in the admin.
  return `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="${PREVIEW_FONTS}">
<style>:root{--font-roboto:"Roboto";--font-montserrat:"Montserrat"}body{margin:0;padding:24px;background:#050505}${BLOG_CONTENT_CSS}</style>
</head><body><div class="blog-content">${html}</div></body></html>`;
}

const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function HtmlMode({
  value,
  onChange,
  sourceRef,
  onPickImage,
  uploading,
}: {
  value: string;
  onChange: (html: string) => void;
  sourceRef: React.RefObject<HTMLTextAreaElement | null>;
  onPickImage: () => void;
  uploading: boolean;
}) {
  return (
    <div className="rte-html">
      <div className="rte-html-pane">
        <p className="form-hint">
          Full control over the layout: use inline <code>style=&quot;…&quot;</code> for design (flex/grid, colours,
          spacing, fonts — <code>var(--font-montserrat)</code> for the heading font). Scripts, <code>&lt;style&gt;</code>{" "}
          tags, event handlers and positioning are removed on save.
        </p>
        <div>
          <button type="button" onClick={onPickImage} disabled={uploading}>
            {uploading ? "Uploading…" : "Upload image at cursor"}
          </button>
        </div>
        <textarea
          ref={sourceRef}
          className="rte-source"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-label="HTML source"
        />
      </div>
      <iframe className="rte-preview" title="Preview" sandbox="" srcDoc={previewDoc(value)} />
    </div>
  );
}
