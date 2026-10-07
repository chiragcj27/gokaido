// The API sends the browser here when ICICI's return can't be trusted or
// matched to an order (bad secureHash, unknown merchantTxnNo). The order — if
// one exists — is still reconciled by ICICI's server-to-server payment-advice.

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Payment Issue", robots: { index: false } };

export default function CheckoutFailedPage() {
  return (
    <main className="mx-auto flex max-w-360 flex-col gap-16 px-4 pt-16 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 rounded-2xl border border-white/10 bg-panel px-8 py-20 text-center">
        <span aria-hidden="true" className="font-heading text-4xl font-bold text-red">
          !
        </span>
        <h1 className="m-0 font-heading text-2xl font-bold tracking-[0.04em] text-paper uppercase">
          We couldn&apos;t confirm your payment
        </h1>
        <p className="m-0 max-w-md font-sans text-sm text-paper/50">
          If money was deducted, your order will update automatically once the bank confirms it. Otherwise your bag is
          still saved and you can try again.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/checkout"
            className="flex h-12 items-center justify-center rounded-lg border-0 bg-red px-8 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-opacity duration-200 hover:opacity-90"
          >
            Back to Checkout
          </Link>
        </div>
      </div>
    </main>
  );
}
