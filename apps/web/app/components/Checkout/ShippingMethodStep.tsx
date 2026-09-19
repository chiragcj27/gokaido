export type ShippingMethodId = "standard" | "express";

export interface ShippingOption {
  id: ShippingMethodId;
  label: string;
  description: string;
  cost: number;
}

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: "standard", label: "Standard Delivery", description: "5-7 business days", cost: 0 },
  { id: "express", label: "Express Delivery", description: "1-2 business days", cost: 150 },
];

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ShippingMethodStep({
  value,
  onChange,
}: {
  value: ShippingMethodId;
  onChange: (value: ShippingMethodId) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="m-0 font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">
        Shipping Method
      </h2>

      <div role="radiogroup" aria-label="Shipping method" className="flex flex-col gap-3">
        {SHIPPING_OPTIONS.map((option) => {
          const selected = value === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.id)}
              className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-4 text-left transition-colors duration-200 ${
                selected ? "border-red bg-red/5" : "border-white/20 hover:border-white/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                    selected ? "border-red" : "border-white/30"
                  }`}
                >
                  {selected && <span className="h-2.5 w-2.5 rounded-full bg-red" />}
                </span>
                <div className="flex flex-col">
                  <span className="font-heading text-sm font-bold tracking-[0.02em] text-paper uppercase">
                    {option.label}
                  </span>
                  <span className="font-sans text-xs text-paper/50">{option.description}</span>
                </div>
              </div>
              <span className="font-heading text-sm font-bold text-paper">
                {option.cost > 0 ? formatInr(option.cost) : "Free"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
