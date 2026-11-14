"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import CheckoutStepper, { type CheckoutStep } from "../components/Checkout/CheckoutStepper";
import CheckoutSummary from "../components/Checkout/CheckoutSummary";
import type { Address } from "../components/Account/AddressesTab";
import CustomerInfoStep, {
  EMPTY_CUSTOMER_INFO,
  customerInfoFromAddress,
  isCustomerInfoComplete,
  type AddressChoice,
  type CustomerInfo,
} from "../components/Checkout/CustomerInfoStep";
import OrderReviewStep from "../components/Checkout/OrderReviewStep";
import { useCart } from "../lib/cartStore";
import { useAuth } from "../lib/auth/authStore";
import { guestRequest, placeOrderAndPay, validateCustomerInfo } from "../lib/checkout/placeOrder";

const STEP_COPY: Record<CheckoutStep, { title: string; subtitle: string }> = {
  customer: { title: "Customer Information", subtitle: "Enter your contact details and delivery address" },
  review: {
    title: "Order Review",
    subtitle: "Review your order, then pay securely by UPI, card or net banking on ICICI's page",
  },
};

const STEP_ORDER: CheckoutStep[] = ["customer", "review"];

export default function CheckoutPage() {
  const { items } = useCart();
  const { status: authStatus, user, authFetch } = useAuth();
  const [step, setStep] = useState<CheckoutStep>("customer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(EMPTY_CUSTOMER_INFO);
  // Logged-in only: null while loading. Guests have no saved addresses.
  const [savedAddresses, setSavedAddresses] = useState<Address[] | null>(null);
  const [addressChoice, setAddressChoice] = useState<AddressChoice>("new");
  const [saveAddress, setSaveAddress] = useState(true);
  const isLoggedIn = authStatus === "authenticated";
  const router = useRouter();

  // Checkout requires an account. Guests (direct link, "Try again" from /checkout/failed, …)
  // are sent to Login / Sign Up and come back here once signed in via `?next=`.
  useEffect(() => {
    if (authStatus === "guest") router.replace(`/account?next=${encodeURIComponent("/checkout")}`);
  }, [authStatus, router]);

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

  // Load saved addresses and preselect the default (the API sorts it first), so a returning
  // customer can go straight to review without retyping anything.
  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    authFetch<{ addresses: Address[] }>("/addresses")
      .then(({ addresses }) => {
        if (cancelled) return;
        setSavedAddresses(addresses);
        if (addresses[0]) chooseAddress(addresses[0]._id, addresses);
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]); // fall back to typing an address in
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, authFetch]);

  const chooseAddress = (choice: AddressChoice, addresses = savedAddresses ?? []) => {
    setError(null);
    setAddressChoice(choice);
    const saved = addresses.find((a) => a._id === choice);
    setCustomerInfo(
      saved
        ? customerInfoFromAddress(saved, user?.email ?? "")
        : { ...EMPTY_CUSTOMER_INFO, fullName: user?.name ?? "", phone: user?.mobile ?? "", email: user?.email ?? "" },
    );
  };

  const usingSavedAddress = isLoggedIn && addressChoice !== "new";

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
        addressId: usingSavedAddress ? addressChoice : undefined,
        saveAddress: !isGuest && saveAddress,
        onAddressSaved: (address) => {
          setSavedAddresses((prev) => [...(prev ?? []), address]);
          setAddressChoice(address._id);
        },
      });
      // Browser is now navigating to ICICI — leave the button disabled.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place your order. Please try again.");
      setSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (step === "customer" && !usingSavedAddress) {
      const invalid = validateCustomerInfo(customerInfo, { requireEmail: !isLoggedIn });
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

  if (authStatus !== "authenticated") {
    return (
      <main className="mx-auto flex max-w-360 flex-col px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        <p className="m-0 py-24 text-center font-sans text-sm text-paper/40">
          {authStatus === "guest" ? "Please log in or sign up to check out — redirecting…" : "Loading…"}
        </p>
      </main>
    );
  }

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
      ? "Continue to Review"
      : submitting
        ? "Redirecting to Payment…"
        : "Place Order & Pay";
  const ctaDisabled =
    submitting ||
    savedAddresses === null ||
    (step === "customer" && !usingSavedAddress && !isCustomerInfoComplete(customerInfo, { requireEmail: !isLoggedIn }));

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
        {step === "customer" && (
          <CustomerInfoStep
            value={customerInfo}
            onChange={setCustomerInfo}
            // null while saved addresses are loading (guests never reach this — see the guard above).
            savedAddresses={savedAddresses}
            addressChoice={addressChoice}
            onAddressChoice={(choice) => chooseAddress(choice)}
            saveAddress={saveAddress}
            onSaveAddressChange={setSaveAddress}
          />
        )}
        {step === "review" && (
          <OrderReviewStep customerInfo={customerInfo} onEditCustomer={() => goToStep("customer")} />
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
