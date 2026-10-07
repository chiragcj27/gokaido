// Where ICICI's payment-return leg lands: the API verifies the callback, updates
// the order, then 303s here with ?status=success|failed|pending (see
// paymentReturn in apps/api/src/controllers/order.controller.ts).

import type { Metadata } from "next";
import type { PaymentOutcome } from "../../components/Checkout/OrderConfirmation";
import OrderResultClient from "./OrderResultClient";

export const metadata: Metadata = { title: "Your Order", robots: { index: false } };

const OUTCOMES: PaymentOutcome[] = ["success", "failed", "pending"];

export default async function OrderResultPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { orderNumber } = await params;
  const { status } = await searchParams;
  const outcome = OUTCOMES.find((o) => o === status) ?? "pending";

  return (
    <main className="mx-auto flex max-w-360 flex-col gap-16 px-4 pt-16 pb-24 sm:px-6 lg:px-8">
      <OrderResultClient orderNumber={decodeURIComponent(orderNumber)} status={outcome} />
    </main>
  );
}
