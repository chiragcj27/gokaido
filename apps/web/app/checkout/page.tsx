"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import CheckoutStepper, { type CheckoutStep } from "../components/Checkout/CheckoutStepper";
import CheckoutSummary from "../components/Checkout/CheckoutSummary";
import CustomerInfoStep, {
  EMPTY_CUSTOMER_INFO,
  isCustomerInfoComplete,
  type CustomerInfo,
} from "../components/Checkout/CustomerInfoStep";
import PaymentStep, { type PaymentMethodId } from "../components/Checkout/PaymentStep";
import OrderReviewStep from "../components/Checkout/OrderReviewStep";
import { useCart } from "../lib/cartStore";
import { useAuth } from "../lib/auth/authStore";
import { guestRequest, placeOrderAndPay, validateCustomerInfo } from "../lib/checkout/placeOrder";

const STEP_COPY: Record<CheckoutStep, { title: string; subtitle: string }> = {
  customer: { title: "Customer Information", subtitle: "Enter your contact details and delivery address" },
  payment: { title: "Payment", subtitle: "Select a payment method to complete your order" },
  review: { title: "Order Review", subtitle: "Review your order details before placing it" },
};

const STEP_ORDER: CheckoutStep[] = ["customer", "payment", "review"];

export default function CheckoutPage() {
  const { items } = useCart();
  const { status: authStatus, user, authFetch } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("customer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(EMPTY_CUSTOMER_INFO);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("upi");
  const [upiId, setUpiId] = useState("");

  // Prefill contact details for a logged-in customer (name/mobile can't change after registration anyway).
  useEffect(() => {
    if (!user) return;
    setCustomerInfo((prev) => ({
      ...prev,
      fullName: prev.fullName || user.name || "",
      phone: prev.phone || user.mobile || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const goToStep = (target: CheckoutStep) => {
    setError(null);
    setStep(target);
  };

  const placeOrder = async () => {
    setSubmitting(true);
    setError(null);
    const isGuest = authStatus !== "authenticated";
    try {
      await placeOrderAndPay({
        request: isGuest ? guestRequest() : authFetch,
        isGuest,
        items,
        customer: customerInfo,
      });
      // Browser is now navigating to ICICI — leave the button disabled.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order. Please try again.");
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (step === "customer") {
      const invalid = validateCustomerInfo(customerInfo);
      if (invalid) {
        setError(invalid);
        return;
      }
    }
    if (step === "review") {
      void placeOrder();
      return;
    }
    goToStep(STEP_ORDER[STEP_ORDER.indexOf(step) + 1]);
  };

  const handleBack = () => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) goToStep(STEP_ORDER[currentIndex - 1]);
  };

  if (items.length === 0) {
    return (
      <main className="mx-auto flex max-w-360 flex-col gap-16 px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-panel py-20 text-center">
          <p className="m-0 font-heading text-lg font-bold text-paper">Your cart is empty</p>
          <p className="m-0 font-sans text-sm text-paper/50">Add something to your bag before checking out.</p>
          <Link
            href="/collections"
            className="mt-2 rounded-lg border border-white/30 bg-transparent px-6 py-3 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink"
          >
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  const copy = STEP_COPY[step];
  const ctaLabel =
    step === "customer"
      ? "Continue to Payment"
      : step === "payment"
        ? "Continue to Review"
        : submitting
          ? "Redirecting to Payment…"
          : "Place Order & Pay";
  const ctaDisabled =
    submitting || authStatus === "loading" || (step === "customer" && !isCustomerInfoComplete(customerInfo));

  return (
    <main className="mx-auto flex max-w-360 flex-col gap-8 px-4 pt-8 pb-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-red uppercase">Checkout</span>
            <h1 className="m-0 font-heading text-4xl font-extrabold text-paper uppercase">{copy.title}</h1>
            <p className="m-0 font-sans text-sm text-paper/50">{copy.subtitle}</p>
          </div>

          {step === "customer" ? (
            <Link
              href="/cart"
              className="flex items-center gap-2 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase hover:text-gold"
            >
              <span aria-hidden="true">←</span> Back to Cart
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBack}
              className="flex cursor-pointer items-center gap-2 border-0 bg-transparent p-0 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase hover:text-gold"
            >
              <span aria-hidden="true">←</span> Back
            </button>
          )}
        </div>

        <CheckoutStepper current={step} />
      </div>

      {error && (
        <p
          role="alert"
          className="m-0 rounded-lg border border-red/40 bg-red/10 px-4 py-3 font-sans text-sm text-paper"
        >
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
        {step === "customer" && <CustomerInfoStep value={customerInfo} onChange={setCustomerInfo} />}
        {step === "payment" && (
          <PaymentStep value={paymentMethod} onChange={setPaymentMethod} upiId={upiId} onUpiIdChange={setUpiId} />
        )}
        {step === "review" && (
          <OrderReviewStep
            customerInfo={customerInfo}
            paymentMethod={paymentMethod}
            onEditCustomer={() => goToStep("customer")}
            onEditPayment={() => goToStep("payment")}
          />
        )}

        <div className="lg:sticky lg:top-6">
          <CheckoutSummary
            itemCount={itemCount}
            subtotal={subtotal}
            shippingCost={0}
            ctaLabel={ctaLabel}
            onContinue={handleContinue}
            ctaDisabled={ctaDisabled}
          />
        </div>
      </div>
    </main>
  );
}
