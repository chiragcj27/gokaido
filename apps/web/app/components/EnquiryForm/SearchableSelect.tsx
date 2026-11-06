"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

// Rendering thousands of rows makes typing lag; people narrow long lists by typing.
const MAX_VISIBLE = 100;

interface Props {
  /** Field name submitted with the form. */
  name: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  /** Accept text that isn't in the list. Without this, unmatched text is discarded on blur. */
  allowCustom?: boolean;
  autoComplete?: string;
  className: string;
}

function filterOptions(options: string[], query: string): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return options;
  const startsWith: string[] = [];
  const contains: string[] = [];
  for (const option of options) {
    const index = option.toLowerCase().indexOf(q);
    if (index === 0) startsWith.push(option);
    else if (index > 0) contains.push(option);
  }
  return [...startsWith, ...contains];
}

/** A dropdown you can type into to filter, for lists too long for a native select. */
export default function SearchableSelect({
  name,
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled,
  allowCustom,
  autoComplete,
  className,
}: Props) {
  // null = not typing, so the input shows the committed value and the list is unfiltered.
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const matches = useMemo(() => filterOptions(options, query ?? ""), [options, query]);
  const visible = matches.slice(0, MAX_VISIBLE);
  const customText = allowCustom ? (query ?? "").trim() : "";
  const showList = open && !disabled;

  useEffect(() => {
    if (!showList || activeIndex < 0) return;
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [showList, activeIndex]);

  const findExact = (text: string) => options.find((o) => o.toLowerCase() === text.trim().toLowerCase());

  function commit(next: string) {
    setQuery(null);
    setOpen(false);
    setActiveIndex(-1);
    if (next !== value) onChange(next);
  }

  function onInput(text: string) {
    setQuery(text);
    setOpen(true);
    setActiveIndex(text.trim() ? 0 : -1);
    // Keeps browser autofill working, which may never move focus out of the field.
    const exact = findExact(text);
    if (exact) onChange(exact);
    else if (allowCustom) onChange(text.trim());
  }

  function onBlur() {
    if (query === null) {
      setOpen(false);
      return;
    }
    const exact = findExact(query);
    if (exact) commit(exact);
    else if (allowCustom || !query.trim()) commit(query.trim());
    else commit(value); // Unmatched text: go back to the last real selection.
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!showList) setOpen(true);
      else if (visible.length) {
        const step = e.key === "ArrowDown" ? 1 : -1;
        setActiveIndex((i) => (i + step + visible.length) % visible.length);
      }
    } else if (e.key === "Enter" && showList) {
      // Picks an option rather than submitting the form.
      e.preventDefault();
      const picked = visible[activeIndex] ?? visible[0];
      if (customText && activeIndex < 0 && !findExact(customText)) commit(customText);
      else if (picked) commit(picked);
      else if (customText) commit(customText);
    } else if (e.key === "Escape" && showList) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <input
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        required
        disabled={disabled}
        autoComplete={autoComplete}
        maxLength={120}
        placeholder={placeholder}
        value={query ?? value}
        onChange={(e) => onInput(e.target.value)}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`${className} pr-10 disabled:cursor-not-allowed disabled:opacity-50`}
      />
      <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute top-1/2 right-4 h-3.5 w-3.5 -translate-y-1/2 text-paper/80">
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth={1.75} />
      </svg>

      {/* Always mounted so aria-controls points at a real element. */}
      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        data-lenis-prevent
        hidden={!showList}
        // preventDefault keeps focus in the input, so blur doesn't commit before the click lands.
        onMouseDown={(e) => e.preventDefault()}
        className="absolute top-full right-0 left-0 z-20 m-0 mt-1 max-h-60 list-none overflow-y-auto rounded-md border border-paper/15 bg-panel p-1 font-sans text-sm text-paper shadow-lg"
      >
        {visible.map((option, index) => (
          <li
            key={option}
            id={`${listId}-${index}`}
            role="option"
            aria-selected={option === value}
            onClick={() => commit(option)}
            onMouseEnter={() => setActiveIndex(index)}
            className={`cursor-pointer rounded px-3 py-2 ${index === activeIndex ? "bg-paper/15" : ""} ${option === value ? "font-semibold" : ""}`}
          >
            {option}
          </li>
        ))}
        {matches.length > MAX_VISIBLE && <li className="px-3 py-2 text-paper/60">Keep typing to see more…</li>}
        {matches.length === 0 &&
          (customText ? (
            <li className="px-3 py-2 text-paper/60">Not listed. We&apos;ll use &ldquo;{customText}&rdquo;.</li>
          ) : (
            <li className="px-3 py-2 text-paper/60">No matches</li>
          ))}
      </ul>
    </div>
  );
}
