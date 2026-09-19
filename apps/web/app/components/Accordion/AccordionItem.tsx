"use client";

import { useState } from "react";

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  uppercaseTitle?: boolean;
  /** "dark" (default) matches the page's dark sections; "light" is for light-background sections like FAQ. */
  theme?: "dark" | "light";
}

export default function AccordionItem({
  title,
  children,
  defaultOpen = false,
  uppercaseTitle = false,
  theme = "dark",
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const isLight = theme === "light";

  return (
    <div className={isLight ? "border-b border-ink/10" : "border-b border-white/10"}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-4 text-left"
      >
        <span
          className={`font-heading text-sm font-semibold ${uppercaseTitle ? "tracking-[0.04em] uppercase" : ""} ${
            isLight ? "text-ink" : "text-paper"
          }`}
        >
          {title}
        </span>
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
            isLight ? "border-ink/20 text-ink" : "border-white/20 text-paper"
          } ${open ? "rotate-45" : ""}`}
        >
          +
        </span>
      </button>
      <div
        className={`grid overflow-hidden transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] pb-4 opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className={`m-0 font-sans text-sm leading-relaxed ${isLight ? "text-ink/60" : "text-paper/60"}`}>
            {children}
          </p>
        </div>
      </div>
    </div>
  );
}
