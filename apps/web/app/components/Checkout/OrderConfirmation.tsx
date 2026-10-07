import Link from "next/link";

export type PaymentOutcome = "success" | "failed" | "pending";

function formatInr(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

const COPY: Record<PaymentOutcome, { icon: string; heading: string; body: (email?: string) => string }> = {
  success: {
    icon: "✓",
    heading: "Payment received",
    body: (email) => `Confirmation and tracking details will be sent to ${email || "you"} shortly.`,
  },
  pending: {
    icon: "…",
    heading: "Confirming your payment",
    body: () =>
      "Your bank hasn't confirmed this payment yet. We'll update your order as soon as it does — no need to pay again.",
  },
  failed: {
    icon: "✕",
    heading: "Payment failed",
    body: () => "No money was taken for this order. Your bag is still saved — you can try again.",
  },
};

const buttonClass =
  "flex h-12 items-center justify-center rounded-lg border-0 bg-red px-8 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-opacity duration-200 hover:opacity-90";

export default function OrderConfirmation({
  status,
  orderNumber,
  total,
  email,
}: {
  status: PaymentOutcome;
  orderNumber?: string;
  total?: number;
  email?: string;
}) {
  const copy = COPY[status];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-panel px-8 py-20 text-center">
      <span aria-hidden="true" className="font-heading text-4xl font-bold text-red">
        {copy.icon}
      </span>

      <h1 className="m-0 font-heading text-2xl font-bold tracking-[0.04em] text-paper uppercase">{copy.heading}</h1>
      {orderNumber && (
        <p className="m-0 font-heading text-sm font-bold tracking-[0.04em] text-paper/70 uppercase">
          Order #{orderNumber}
        </p>
      )}
      <p className="m-0 max-w-md font-sans text-sm text-paper/50">{copy.body(email)}</p>

      {total !== undefined && (
        <p className="m-0 font-sans text-base text-paper">
          <span className="text-paper/50 uppercase">{status === "success" ? "Total Paid:" : "Order Total:"}</span>{" "}
          <span className="font-bold">{formatInr(total)}</span>
        </p>
      )}

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        {status === "failed" ? (
          <Link href="/checkout" className={buttonClass}>
            Try Again
          </Link>
        ) : (
          <Link href="/collections" className={buttonClass}>
            Continue Shopping
          </Link>
        )}
        <Link href="/account" className={buttonClass}>
          My Account
        </Link>
      </div>
    </div>
  );
}
