"use client";

// My Wishlist — Figma "Wishlist". Cards reuse PoppedCard (cardImage, price/MRP, colour swatches,
// Add to Cart) with the filled heart from the design layered on top to remove the item.

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest, useAuth } from "../../lib/auth/authStore";
import { useCart } from "../../lib/cartStore";
import type { ApiColor } from "../../lib/pdp/apiTypes";
import { colorLookup } from "../../lib/pdp/adapter";
import PoppedCard from "../PoppedCard/PoppedCard";
import { ErrorText, Panel, PanelTitle, formatPrice, redButtonClass } from "./ui";

interface WishlistVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
  mrp?: number;
  images?: string[];
  isActive: boolean;
}

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  cardImage?: string;
  images?: string[];
  isActive: boolean;
  variants?: WishlistVariant[];
}

const PLACEHOLDER_IMAGE = "/dummy/product-placeholder.png";

function WishlistCard({
  product,
  resolveColor,
  onRemove,
}: {
  product: WishlistProduct;
  resolveColor: ReturnType<typeof colorLookup>;
  onRemove: () => void;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const active = (product.variants ?? []).filter((v) => v.isActive);
  const colors = [...new Map(active.map((v) => [v.color, { name: v.color, hex: resolveColor(v.color).hex }])).values()];
  const [color, setColor] = useState(colors[0]?.name ?? "");

  const cheapest = active.reduce<WishlistVariant | undefined>((min, v) => (!min || v.basePrice < min.basePrice ? v : min), undefined);
  const subtitle = product.subcategory ?? product.category;
  const colorHref = color ? `/products/${product.slug}/${resolveColor(color).slug}` : `/products/${product.slug}`;

  // A size has to be chosen before anything goes in the bag: add straight away only when the
  // selected colour has exactly one size in stock, otherwise open that colour's product page.
  const addToCart = () => {
    const inStock = active.filter((v) => v.color === color && v.stock > 0);
    if (inStock.length !== 1) return router.push(colorHref);
    const v = inStock[0];
    addItem({
      id: v.sku,
      productId: product._id,
      productSlug: product.slug,
      name: product.name,
      category: subtitle,
      imageSrc: v.images?.[0] ?? product.cardImage ?? PLACEHOLDER_IMAGE,
      size: v.size,
      color: v.color,
      price: v.basePrice,
    });
  };

  return (
    <div className="relative">
      <PoppedCard
        variant="product"
        href={colorHref}
        imageSrc={product.cardImage ?? PLACEHOLDER_IMAGE}
        imageAlt={product.name}
        title={product.name}
        subtitle={product.isActive ? subtitle : "No longer available"}
        price={cheapest ? formatPrice(cheapest.basePrice) : undefined}
        originalPrice={cheapest?.mrp && cheapest.mrp > cheapest.basePrice ? formatPrice(cheapest.mrp) : undefined}
        colors={colors}
        onColorSelect={(c) => setColor(c.name)}
        onAddToCart={product.isActive && active.length ? addToCart : undefined}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${product.name} from wishlist`}
        title="Remove from wishlist"
        className="absolute top-2 right-2 z-30 flex items-center justify-center p-1 transition-transform hover:scale-110"
      >
        <Image src="/account/heart.svg" alt="" width={28.7162} height={24.8874} />
      </button>
    </div>
  );
}

export default function WishlistTab() {
  const { authFetch } = useAuth();
  const [items, setItems] = useState<WishlistProduct[] | null>(null);
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    authFetch<{ wishlist: WishlistProduct[] }>("/users/me/wishlist")
      .then(({ wishlist }) => setItems(wishlist))
      .catch(() => setError("Couldn't load your wishlist."));
  }, [authFetch]);

  useEffect(load, [load]);
  useEffect(() => {
    // Swatch hexes / colour slugs; cards fall back to a neutral swatch if this fails.
    apiRequest<{ colors: ApiColor[] }>("/colors")
      .then((r) => setColors(r.colors))
      .catch(() => {});
  }, []);

  const resolveColor = useMemo(() => colorLookup(colors), [colors]);

  const remove = async (id: string) => {
    setItems((list) => list?.filter((p) => p._id !== id) ?? null);
    try {
      await authFetch(`/users/me/wishlist/${id}`, { method: "DELETE" });
    } catch {
      setError("Couldn't remove the item.");
      load();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelTitle>My Wishlist</PanelTitle>
      </Panel>
      <ErrorText>{error}</ErrorText>
      {items === null ? (
        !error && <p className="m-0 font-sans text-sm text-paper/40">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-6 py-16 text-center">
          <p className="m-0 font-heading text-base text-paper/70">Your wishlist is empty. Tap the heart on any product to save it here.</p>
          <Link href="/collections" className={`${redButtonClass} px-8 no-underline`}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-y-16 2xl:grid-cols-[repeat(3,18rem)] 2xl:gap-x-[6.75rem]">
          {items.map((p) => (
            <WishlistCard key={p._id} product={p} resolveColor={resolveColor} onRemove={() => remove(p._id)} />
          ))}
        </div>
      )}
    </div>
  );
}
