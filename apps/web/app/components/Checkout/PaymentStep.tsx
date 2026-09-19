// Payment method is chosen here, but no card/bank credentials are ever
// collected on this page — ICICI's Standard/redirect flow (see CLAUDE.md
// "Payment Gateway") sends the browser to ICICI's own hosted page for
// card/UPI/net-banking entry, which is what keeps this codebase out of
// PCI-DSS SAQ scope. Don't add card number/CVV inputs here.

export type PaymentMethodId = "upi" | "card" | "netbanking";

const PAYMENT_METHODS: { id: PaymentMethodId; label: string; description: string }[] = [
  { id: "upi", label: "UPI", description: "Pay using any UPI app" },
  { id: "card", label: "Card", description: "Credit or debit card" },
  { id: "netbanking", label: "Net Banking", description: "All major Indian banks" },
];

const inputClass =
  "h-12 w-full rounded-lg border border-white/20 bg-transparent px-3 font-sans text-sm text-paper placeholder:text-paper/40 focus:border-white/50 focus:outline-none";

export default function PaymentStep({
  value,
  onChange,
  upiId,
  onUpiIdChange,
}: {
  value: PaymentMethodId;
  onChange: (value: PaymentMethodId) => void;
  upiId: string;
  onUpiIdChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-panel p-6">
      <h2 className="m-0 font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">Payment</h2>

      <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
        {PAYMENT_METHODS.map((method) => {
          const selected = value === method.id;
          return (
            <div key={method.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(method.id)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors duration-200 ${
                  selected ? "border-red bg-red/5" : "border-white/20 hover:border-white/40"
                } ${selected ? "rounded-b-none border-b-0" : ""}`}
              >
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
                    {method.label}
                  </span>
                  <span className="font-sans text-xs text-paper/50">{method.description}</span>
                </div>
              </button>

              {selected && method.id === "upi" && (
                <div className="flex flex-col gap-2 rounded-b-lg border border-t-0 border-red bg-red/5 px-4 pb-4">
                  <label htmlFor="upiId" className="font-sans text-xs tracking-[0.04em] text-paper/50 uppercase">
                    UPI ID (optional)
                  </label>
                  <input
                    id="upiId"
                    type="text"
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(event) => onUpiIdChange(event.target.value)}
                    className={inputClass}
                  />
                </div>
              )}

              {selected && method.id === "netbanking" && (
                <p className="m-0 rounded-b-lg border border-t-0 border-red bg-red/5 px-4 pb-4 font-sans text-xs leading-relaxed text-paper/50">
                  You&apos;ll be redirected to your bank&apos;s secure login page to complete payment.
                </p>
              )}

              {selected && method.id === "card" && (
                <p className="m-0 rounded-b-lg border border-t-0 border-red bg-red/5 px-4 pb-4 font-sans text-xs leading-relaxed text-paper/50">
                  You&apos;ll be redirected to our payment partner&apos;s secure page to enter your card details.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="m-0 flex items-start gap-2 font-sans text-xs leading-relaxed text-paper/40">
        <span aria-hidden="true">🔒</span>
        You&apos;ll securely enter your payment details on our payment partner&apos;s page. We never see or store
        your card details.
      </p>
    </div>
  );
}
