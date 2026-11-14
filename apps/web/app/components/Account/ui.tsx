// Small shared building blocks for the account pages (login/sign-up + My Account).

export const inputClass =
  "h-12 w-full rounded-md border border-[#2e2e2e] bg-[#0c0c0c] px-3.5 font-sans text-sm text-paper placeholder:text-paper/40 focus:border-white/40 sm:text-base focus:outline-none disabled:cursor-not-allowed disabled:text-paper/60";

export const labelClass = "font-sans text-xs text-[#ababab] uppercase sm:text-sm";

export const primaryButtonClass =
  "h-10 w-full rounded-md bg-red font-heading text-xs font-bold tracking-[0.06em] text-paper uppercase transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const outlineButtonClass =
  "rounded-md border border-white/20 px-5 py-2.5 font-heading text-[0.65rem] font-bold tracking-[0.06em] text-paper uppercase transition-colors hover:border-white/50 disabled:opacity-50";

/** Account-area surface (Figma: #0c0c0c fill, #2e2e2e 1.4px border, ~6px radius). */
export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`rounded-md border border-[#2e2e2e] bg-[#0c0c0c] px-5 py-5 sm:px-8 sm:py-6 ${className}`}>{children}</section>
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="m-0 font-heading text-base font-bold text-paper uppercase sm:text-xl">{children}</h2>;
}

/** Red text-link action used on panels ("EDIT"). */
export const panelLinkClass = "font-heading text-sm font-bold text-[#eb141a] uppercase hover:opacity-80";

/** Solid red action button (Figma: #c10e12, square corners). */
export const redButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 bg-[#c10e12] px-4 font-heading text-sm text-[#fafafa] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base";

/** Multi-line postal address block shared by profile, address and order views. */
export function AddressLines({
  address,
  className = "",
}: {
  address: { name: string; line1: string; line2?: string; city: string; state: string; pincode: string; mobile: string };
  className?: string;
}) {
  return (
    <address className={`font-sans text-sm leading-snug text-[#c2c2c2] not-italic sm:text-base ${className}`}>
      {address.name}
      <br />
      {address.line1}
      {address.line2 && `, ${address.line2}`},
      <br />
      {address.city}, {address.state} - {address.pincode}
      <br />
      India
      <br />
      +91 {address.mobile}
    </address>
  );
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

/** "Dec 30, 2019 05:18" — the orders table's date column. */
export function formatDateTime(date: string) {
  const d = new Date(date);
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${time}`;
}

/** "INR 1,500" — orders use the design's INR prefix rather than ₹. */
export function formatInr(amount: number) {
  return `INR ${amount.toLocaleString("en-IN")}`;
}
