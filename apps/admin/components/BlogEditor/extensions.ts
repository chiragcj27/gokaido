import { Extension } from "@tiptap/core";
import Image from "@tiptap/extension-image";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontWeight: {
      setFontWeight: (weight: string) => ReturnType;
      unsetFontWeight: () => ReturnType;
    };
  }
}

/** Font weight (300–900) as a textStyle attribute, rendered as `style="font-weight: …"`. */
export const FontWeight = Extension.create({
  name: "fontWeight",
  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (el) => el.style.fontWeight || null,
            renderHTML: (attrs) => (attrs.fontWeight ? { style: `font-weight: ${attrs.fontWeight}` } : {}),
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontWeight:
        (weight) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontWeight: weight }).run(),
      unsetFontWeight:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontWeight: null }).removeEmptyTextStyle().run(),
    };
  },
});

export type ImageAlign = "left" | "center" | "right" | "full";

// Stored purely as inline style so it survives the API's sanitizer (which drops data-* attributes).
const ALIGN_STYLE: Record<ImageAlign, string> = {
  left: "float: left; margin-right: 1.5em; max-width: 50%",
  right: "float: right; margin-left: 1.5em; max-width: 50%",
  center: "display: block; margin-left: auto; margin-right: auto",
  full: "display: block; width: 100%",
};

function readAlign(el: HTMLElement): ImageAlign | null {
  const s = el.style;
  if (s.float === "left") return "left";
  if (s.float === "right") return "right";
  if (s.width === "100%") return "full";
  if (s.marginLeft === "auto" && s.marginRight === "auto") return "center";
  return null;
}

/** Image with a resize handle and left / centre / right / full-width alignment. */
export const BlogImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: null,
        parseHTML: (el) => readAlign(el),
        renderHTML: (attrs) => (attrs.align ? { style: ALIGN_STYLE[attrs.align as ImageAlign] } : {}),
      },
    };
  },
}).configure({
  resize: { enabled: true, alwaysPreserveAspectRatio: true, minWidth: 80, minHeight: 40 },
});
