import sanitizeHtml from "sanitize-html";

// Blog bodies are authored as HTML in the admin editor (visual or raw-source mode) and rendered
// verbatim on the storefront, so everything is cleaned here on save. Admins are trusted, but a
// stolen admin token shouldn't turn into stored XSS on every visitor: no <script>/<style>/event
// handlers, no javascript: URLs, no CSS that can load URLs or break out of the article
// (position/z-index are left out so a post can't overlay the site's header or checkout).

// Any CSS value made of ordinary tokens — rejects url(), expression(), javascript:, and anything
// with characters outside that set (e.g. ";" or "\" escapes).
const SAFE_CSS_VALUE = /^(?!.*(?:url\s*\(|expression|javascript:|@import))[-\w\s#.,%()'"/+*!]+$/i;

const STYLE_PROPERTIES = [
  "color",
  "background-color",
  "background",
  "font-size",
  "font-weight",
  "font-family",
  "font-style",
  "text-align",
  "text-decoration",
  "text-transform",
  "text-indent",
  "line-height",
  "letter-spacing",
  "white-space",
  "vertical-align",
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "border-color",
  "border-style",
  "border-width",
  "border-radius",
  "border-collapse",
  "display",
  "flex",
  "flex-direction",
  "flex-wrap",
  "flex-basis",
  "flex-grow",
  "flex-shrink",
  "justify-content",
  "align-items",
  "align-self",
  "gap",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-template-rows",
  "grid-column",
  "grid-row",
  "object-fit",
  "object-position",
  "aspect-ratio",
  "float",
  "clear",
  "opacity",
  "box-shadow",
  "overflow",
] as const;

const allowedStyles = Object.fromEntries(STYLE_PROPERTIES.map((p) => [p, [SAFE_CSS_VALUE]]));

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img",
    "h1",
    "h2",
    "span",
    "div",
    "section",
    "figure",
    "figcaption",
    "mark",
    "u",
    "s",
    "del",
    "ins",
    "sub",
    "sup",
    "iframe",
    "colgroup",
    "col",
  ],
  allowedAttributes: {
    "*": ["style", "id", "title", "dir", "lang"],
    a: ["href", "target", "rel", "name"],
    img: ["src", "alt", "width", "height", "loading"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "frameborder"],
    td: ["colspan", "rowspan", "colwidth"],
    th: ["colspan", "rowspan", "colwidth", "scope"],
    col: ["span"],
    ol: ["start", "type"],
    div: ["data-youtube-video"],
  },
  allowedStyles: { "*": allowedStyles },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["https", "http"], iframe: ["https"] },
  allowProtocolRelative: false,
  allowedIframeHostnames: ["www.youtube.com", "www.youtube-nocookie.com", "youtube.com", "player.vimeo.com"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === "_blank" ? { ...attribs, rel: "noopener noreferrer" } : attribs,
    }),
    img: (tagName, attribs) => ({ tagName, attribs: { loading: "lazy", ...attribs } }),
  },
};

export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, OPTIONS).trim();
}
