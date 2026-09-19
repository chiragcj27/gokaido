"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import CartItem from "../components/CartItem/CartItem";
import OrderSummary from "../components/OrderSummary/OrderSummary";
import RelatedProducts from "../components/RelatedProducts/RelatedProducts";
import { useCart } from "../lib/cartStore";
import { dummyProduct } from "../lib/dummyProduct";

export default function CartPage() {
  const { items, updateQuantity, removeItem } = useCart();
  const router = useRouter();

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  const handleSaveForLater = (id: string) => {
    console.log(`Saved item ${id} for later`);
  };

  const handleApplyDiscount = (code: string) => {
    console.log(`Applying discount code ${code}`);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  return (
    <main className="mx-auto flex max-w-360 flex-col gap-16 px-4 pt-8 pb-24 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="font-heading text-xs font-bold tracking-[0.08em] text-red uppercase">Shopping Bag</span>
            <h1 className="m-0 font-heading text-4xl font-extrabold text-paper uppercase">Your Cart</h1>
            <p className="m-0 font-sans text-sm text-paper/50">Review your items and proceed to checkout.</p>
          </div>

          <Link
            href="/collections"
            className="flex items-center gap-2 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase hover:text-gold"
          >
            <span aria-hidden="true">←</span> Continue Shopping
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-panel py-20 text-center">
          <p className="m-0 font-heading text-lg font-bold text-paper">Your cart is empty</p>
          <p className="m-0 font-sans text-sm text-paper/50">Looks like you haven&apos;t added anything yet.</p>
          <Link
            href="/collections"
            className="mt-2 rounded-lg border border-white/30 bg-transparent px-6 py-3 font-heading text-xs font-bold tracking-[0.04em] text-paper uppercase transition-colors duration-200 hover:bg-paper hover:text-ink"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-white/10 bg-panel px-6">
            <div className="hidden grid-cols-[1fr_240px] gap-6 border-b border-white/10 py-4 font-heading text-[11px] font-bold tracking-[0.06em] text-paper/50 uppercase sm:grid">
              <span>Product</span>
              <div className="grid grid-cols-[1fr_80px_36px] gap-6">
                <span>Quantity</span>
                <span className="text-right">Total</span>
                <span />
              </div>
            </div>

            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantityChange={updateQuantity}
                onRemove={removeItem}
                onSaveForLater={handleSaveForLater}
              />
            ))}
          </div>

          <div className="lg:sticky lg:top-6">
            <OrderSummary
              itemCount={itemCount}
              subtotal={subtotal}
              onApplyDiscount={handleApplyDiscount}
              onCheckout={handleCheckout}
            />
          </div>
        </div>
      )}

      <RelatedProducts title="You May Also Like" products={dummyProduct.relatedProducts} />
    </main>
  );
}
