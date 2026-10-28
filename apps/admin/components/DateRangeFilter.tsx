"use client";

export interface DateRange {
  from: string;
  to: string;
}

// YYYY-MM-DD in the browser's local day (the admins are in India, matching
// the API's IST day boundaries).
function isoDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDay(d);
}

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: "Today", range: () => ({ from: daysAgo(0), to: daysAgo(0) }) },
  { label: "7 days", range: () => ({ from: daysAgo(6), to: daysAgo(0) }) },
  { label: "30 days", range: () => ({ from: daysAgo(29), to: daysAgo(0) }) },
  {
    label: "This month",
    range: () => {
      const d = new Date();
      return { from: isoDay(new Date(d.getFullYear(), d.getMonth(), 1)), to: daysAgo(0) };
    },
  },
];

export default function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRange;
  onChange: (range: DateRange) => void;
}) {
  return (
    <div className="date-range">
      <label>
        From
        <input type="date" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} />
      </label>
      <label>
        To
        <input type="date" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} />
      </label>
      <div className="date-range-presets">
        {PRESETS.map((p) => (
          <button key={p.label} type="button" className="chip" onClick={() => onChange(p.range())}>
            {p.label}
          </button>
        ))}
        {(value.from || value.to) && (
          <button type="button" className="link-button" onClick={() => onChange({ from: "", to: "" })}>
            Clear dates
          </button>
        )}
      </div>
    </div>
  );
}
