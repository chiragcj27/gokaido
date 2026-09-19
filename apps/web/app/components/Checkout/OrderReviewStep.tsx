import type { CustomerInfo } from "./CustomerInfoStep";
import { SHIPPING_OPTIONS, type ShippingMethodId } from "./ShippingMethodStep";

const PAYMENT_LABELS: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net Banking",
};

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="cursor-pointer border-0 bg-transparent p-0 font-heading text-[11px] font-bold tracking-[0.02em] text-red uppercase hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="font-sans text-sm text-paper">{children}</div>
    </div>
  );
}

export default function OrderReviewStep({
  customerInfo,
  shippingMethod,
  paymentMethod,
  onEditCustomer,
  onEditShipping,
  onEditPayment,
}: {
  customerInfo: CustomerInfo;
  shippingMethod: ShippingMethodId;
  paymentMethod: string;
  onEditCustomer: () => void;
  onEditShipping: () => void;
  onEditPayment: () => void;
}) {
  const shippingOption = SHIPPING_OPTIONS.find((option) => option.id === shippingMethod);

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-panel px-6">
      <ReviewBlock title="Delivery Address" onEdit={onEditCustomer}>
        <p className="m-0">{customerInfo.fullName}</p>
        <p className="m-0 text-paper/60">
          {customerInfo.address}, {customerInfo.city}, {customerInfo.state} - {customerInfo.pincode}
        </p>
        <p className="m-0 text-paper/60">{customerInfo.phone}</p>
      </ReviewBlock>

      <ReviewBlock title="Shipping Method" onEdit={onEditShipping}>
        <p className="m-0">
          {shippingOption?.label} · {shippingOption && shippingOption.cost > 0 ? `₹${shippingOption.cost}` : "Free"}
        </p>
      </ReviewBlock>

      <ReviewBlock title="Payment" onEdit={onEditPayment}>
        <p className="m-0">{PAYMENT_LABELS[paymentMethod] ?? paymentMethod}</p>
      </ReviewBlock>
    </div>
  );
}
