// Small shared building blocks for the account pages (login/sign-up + My Account).

export const inputClass =
  "h-10 w-full rounded-md border border-white/15 bg-black px-3 font-sans text-sm text-paper placeholder:text-paper/40 focus:border-white/40 focus:outline-none disabled:cursor-not-allowed disabled:text-paper/60";

export const labelClass = "font-sans text-[0.65rem] tracking-[0.06em] text-paper/50 uppercase";

export const primaryButtonClass =
  "h-10 w-full rounded-md bg-red font-heading text-xs font-bold tracking-[0.06em] text-paper uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const outlineButtonClass =
  "rounded-md border border-white/20 px-5 py-2.5 font-heading text-[0.65rem] font-bold tracking-[0.06em] text-paper uppercase transition-colors hover:border-white/50 disabled:opacity-50";

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-lg border border-white/10 bg-panel p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="m-0 font-heading text-xs font-bold tracking-[0.06em] text-paper uppercase">{children}</h2>;
}

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {hint && <span className="font-sans text-[0.65rem] text-paper/40">{hint}</span>}
    </div>
  );
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" className="m-0 font-sans text-xs text-red">
      {children}
    </p>
  );
}

/** Splits the single stored `name` into the first/last pair the design shows. */
export function splitName(name = "") {
  const [first = "", ...rest] = name.trim().split(/\s+/);
  return { first, last: rest.join(" ") };
}

export function initials(name = "") {
  const { first, last } = splitName(name);
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase() || "?";
}

export function formatPrice(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
