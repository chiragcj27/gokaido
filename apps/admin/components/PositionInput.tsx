"use client";

import { useEffect, useState } from "react";

type Props = {
  /** 1-based current position. */
  position: number;
  max: number;
  /** Called with a 1-based target position, clamped to 1..max. */
  onChange: (position: number) => void;
};

/** Type a row's new position number; commits on Enter or blur. */
export default function PositionInput({ position, max, onChange }: Props) {
  const [value, setValue] = useState(String(position));

  useEffect(() => {
    setValue(String(position));
  }, [position]);

  function commit() {
    const target = Math.min(Math.max(Math.round(Number(value)) || position, 1), max);
    setValue(String(target));
    if (target !== position) onChange(target);
  }

  return (
    <input
      type="number"
      className="position-input"
      min={1}
      max={max}
      value={value}
      aria-label="Position"
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
