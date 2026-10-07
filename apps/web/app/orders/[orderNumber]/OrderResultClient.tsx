"use client";

import { useEffect, useState } from "react";
import OrderConfirmation, { type PaymentOutcome } from "../../components/Checkout/OrderConfirmation";
import { useCart } from "../../lib/cartStore";
import { readPendingOrder, type PendingOrder } from "../../lib/checkout/placeOrder";

export default function OrderResultClient({ orderNumber, status }: { orderNumber: string; status: PaymentOutcome }) {
  const { clearCart } = useCart();
  const [pending, setPending] = useState<PendingOrder | null>(null);

  useEffect(() => {
    setPending(readPendingOrder(orderNumber));
    // Only a confirmed payment empties the bag; failed/pending keep it for another attempt.
    if (status === "success") clearCart();
  }, [orderNumber, status, clearCart]);

  return (
    <OrderConfirmation status={status} orderNumber={orderNumber} total={pending?.total} email={pending?.email} />
  );
}
