"use client";

import { useState } from "react";

export type AccordionTheme = "dark" | "light" | "darkMobile";

export interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  uppercaseTitle?: boolean;
  /**
   * "dark" (default) matches the page's dark sections; "light" is for light-background sections like FAQ;
   * "darkMobile" is dark below `lg` and light from `lg` up (the FAQ section is dark only in the mobile design).
   */
  theme?: AccordionTheme;
}

const THEME_CLASSES: Record<AccordionTheme, { row: string; title: string; icon: string; body: string }> = {
  dark: {
    row: "border-white/10 max-lg:border-white/30",
    title: "text-paper",
    icon: "border-white/20 text-paper",
    body: "text-paper/60",
  },
  light: {
    row: "border-ink/10",
    title: "text-ink",
    icon: "border-ink/20 text-ink",
    body: "text-ink/60",
  },
  darkMobile: {
    row: "border-white/70 max-lg:border-b-2 lg:border-ink/10",
    title: "text-paper lg:text-ink",
    icon: "border-paper text-paper max-lg:h-8 max-lg:w-8 max-lg:text-xl lg:border-ink/20 lg:text-ink",
    body: "text-paper/60 lg:text-ink/60",
  },
};

export default function AccordionItem({
  title,
  children,
  defaultOpen = false,
  uppercaseTitle = false,
  theme = "dark",
}: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);
  const classes = THEME_CLASSES[theme];

  return (
    <div className={`border-b ${classes.row}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-4 text-left max-lg:py-5"
      >
        <span
          className={`font-heading text-sm font-semibold ${
            uppercaseTitle ? "tracking-[0.04em] uppercase max-lg:text-[15px] max-lg:tracking-[0.12em]" : "max-lg:text-[15px]"
          } ${classes.title}`}
        >
          {title}
        </span>
        {/* Uppercase section rows (Material & Padding etc.) use a filled, borderless circle on mobile. */}
        <span
          aria-hidden="true"
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-transform duration-200 ${
            classes.icon
          } ${uppercaseTitle ? "max-lg:h-8 max-lg:w-8 max-lg:border-0 max-lg:bg-white/6 max-lg:text-lg" : ""} ${
            open ? "rotate-45" : ""
          }`}
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
          <p className={`m-0 font-sans text-sm leading-relaxed max-lg:text-[15px] ${classes.body}`}>{children}</p>
        </div>
      </div>
    </div>
  );
}
