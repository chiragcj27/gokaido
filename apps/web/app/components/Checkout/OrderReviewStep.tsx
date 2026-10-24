import type { CustomerInfo } from "./CustomerInfoStep";

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-white/10 py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between">
        <h3 className="m-0 font-heading text-xs font-bold tracking-[0.08em] text-paper/50 uppercase">{title}</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="cursor-pointer border-0 bg-transparent p-0 font-heading text-[11px] font-bold tracking-[0.02em] text-red uppercase hover:underline"
          >
            Edit
          </button>
        )}
      </div>
      <div className="font-sans text-sm text-paper">{children}</div>
    </div>
  );
}

export default function OrderReviewStep({
  customerInfo,
  onEditCustomer,
}: {
  customerInfo: CustomerInfo;
  onEditCustomer: () => void;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-panel px-6">
      <ReviewBlock title="Delivery Address" onEdit={onEditCustomer}>
        <p className="m-0">{customerInfo.fullName}</p>
        <p className="m-0 text-paper/60">
          {customerInfo.address}, {customerInfo.city}, {customerInfo.state} - {customerInfo.pincode}
        </p>
        <p className="m-0 text-paper/60">{customerInfo.phone}</p>
      </ReviewBlock>

      {/* The method is picked on ICICI's hosted page (Standard/redirect flow — see CLAUDE.md
          "Payment Gateway"), so there's nothing to choose or collect here. */}
      <ReviewBlock title="Payment">
        <p className="m-0">UPI, Card or Net Banking</p>
        <p className="m-0 flex items-start gap-2 pt-1 text-xs leading-relaxed text-paper/40">
          <span aria-hidden="true">🔒</span>
          You&apos;ll choose a method and enter your details on our payment partner&apos;s secure page. We never
          see or store your card details.
        </p>
      </ReviewBlock>
    </div>
  );
}
