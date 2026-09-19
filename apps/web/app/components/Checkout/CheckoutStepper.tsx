export type CheckoutStep = "customer" | "shipping" | "payment" | "review";

const STEPS: { key: CheckoutStep; label: string }[] = [
  { key: "customer", label: "Information" },
  { key: "shipping", label: "Shipping" },
  { key: "payment", label: "Payment" },
  { key: "review", label: "Review" },
];

export default function CheckoutStepper({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;

        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-heading text-xs font-bold ${
                  isComplete
                    ? "bg-gold text-ink"
                    : isCurrent
                      ? "border-2 border-red text-paper"
                      : "border border-white/20 text-paper/40"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </span>
              <span
                className={`hidden font-heading text-xs font-bold tracking-[0.04em] uppercase sm:inline ${
                  isCurrent ? "text-paper" : "text-paper/40"
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span aria-hidden="true" className={`h-px w-6 sm:w-10 ${isComplete ? "bg-gold" : "bg-white/15"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
