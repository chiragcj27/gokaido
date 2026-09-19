export interface CheckoutSummaryProps {
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  shippingLabel?: string;
  ctaLabel: string;
  onContinue: () => void;
  ctaDisabled?: boolean;
}

function formatInr(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function CheckoutSummary({
  itemCount,
  subtotal,
  shippingCost,
  shippingLabel,
  ctaLabel,
  onContinue,
  ctaDisabled = false,
}: CheckoutSummaryProps) {
  const total = subtotal + shippingCost;

  return (
    <aside className="flex flex-col gap-6 rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="m-0 font-heading text-xl font-bold text-paper uppercase">Order Summary</h2>

      <div className="flex flex-col gap-3 font-sans text-sm">
        <div className="flex items-center justify-between text-paper">
          <span>
            Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
          </span>
          <span>{formatInr(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-paper/50">
          <span>Shipping</span>
          <span>{shippingLabel ?? (shippingCost > 0 ? formatInr(shippingCost) : "Free")}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 pt-5">
        <span className="font-heading text-base font-bold text-paper">Total</span>
        <span className="font-heading text-xl font-bold text-paper">{formatInr(total)}</span>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={ctaDisabled}
        className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-0 bg-red font-heading text-sm font-bold tracking-[0.04em] text-paper uppercase transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ctaLabel} <span aria-hidden="true">→</span>
      </button>
    </aside>
  );
}
