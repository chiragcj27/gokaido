import Link from "next/link";

function formatInr(amount: number) {
  return `₹ ${amount.toLocaleString("en-IN")}`;
}

export default function OrderConfirmation({
  orderNumber,
  totalPaid,
  email,
}: {
  orderNumber: string;
  totalPaid: number;
  email: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-panel px-8 py-20 text-center">
      <span aria-hidden="true" className="font-heading text-4xl font-bold text-red">
        ✓
      </span>

      <h1 className="m-0 font-heading text-2xl font-bold tracking-[0.04em] text-paper uppercase">
        Order #{orderNumber}
      </h1>
      <p className="m-0 font-sans text-sm text-paper/50">
        Confirmation and tracking details sent to {email || "your email"}
      </p>

      <p className="m-0 font-sans text-base text-paper">
        <span className="text-paper/50 uppercase">Total Paid:</span> <span className="font-bold">{formatInr(totalPaid)}</span>
      </p>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/collections"
          className="flex h-12 items-center justify-center rounded-lg border-0 bg-red px-8 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-opacity duration-200 hover:opacity-90"
        >
          Continue Shopping
        </Link>
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-lg border-0 bg-red px-8 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-opacity duration-200 hover:opacity-90"
        >
          View Order
        </Link>
      </div>
    </div>
  );
}
