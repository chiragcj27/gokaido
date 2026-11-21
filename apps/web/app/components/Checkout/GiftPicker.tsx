"use client";

// "Redeem a gift" block on the checkout review step. Points are spent on
// whole gifts that ship free with the order — never taken off the bill. The
// API re-validates everything (balance, stock, tier) when the order is placed.
// No Figma frame yet — styled to match the review step.

import { useState } from "react";
import {
  formatPoints,
  tierAllows,
  type GiftPick,
  type GiftProduct,
  type RewardsSummary,
} from "../../lib/rewards";

const variantLabel = (v: { color: string; size: string }) => `${v.color} · ${v.size}`;

function GiftCard({
  gift,
  summary,
  remaining,
  picked,
  onAdd,
  onRemove,
}: {
  gift: GiftProduct;
  summary: RewardsSummary;
  remaining: number;
  picked?: GiftPick;
  onAdd: (pick: GiftPick) => void;
  onRemove: () => void;
}) {
  const firstInStock = gift.variants.find((v) => v.inStock) ?? gift.variants[0];
  const [sku, setSku] = useState(picked?.variantSku ?? firstInStock.sku);
  const variant = gift.variants.find((v) => v.sku === sku) ?? firstInStock;
  const tierLocked = !tierAllows(summary.membership.tier, gift.minTier);
  const lockedTierLabel = summary.tiers.find((t) => t.tier === gift.minTier)?.label;

  let blocker: string | null = null;
  if (tierLocked) blocker = `For ${lockedTierLabel}s`;
  else if (!variant.inStock) blocker = "Out of stock";
  else if (!picked && variant.pointsCost > remaining) blocker = `Need ${formatPoints(variant.pointsCost - remaining)} more`;

  return (
    <li className={`flex gap-3 rounded-lg border p-3 ${picked ? "border-gold/60 bg-gold/5" : "border-white/10"}`}>
      {gift.image ? (
        <img src={gift.image} alt="" className="size-16 shrink-0 rounded object-cover" />
      ) : (
        <span className="size-16 shrink-0 rounded bg-white/10" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="truncate font-sans text-sm text-paper">{gift.name}</span>
        {gift.variants.length > 1 ? (
          <select
            value={sku}
            disabled={Boolean(picked)}
            onChange={(e) => setSku(e.target.value)}
            aria-label={`${gift.name} option`}
            className="h-8 max-w-full rounded border border-white/15 bg-[#0c0c0c] px-2 font-sans text-xs text-paper disabled:opacity-60"
          >
            {gift.variants.map((v) => (
              <option key={v.sku} value={v.sku} disabled={!v.inStock}>
                {variantLabel(v)} — {formatPoints(v.pointsCost)}
                {v.inStock ? "" : " (out of stock)"}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-sans text-xs text-paper/50">{variantLabel(variant)}</span>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-heading text-xs font-bold text-gold">{formatPoints(variant.pointsCost)}</span>
          {picked ? (
            <button
              type="button"
              onClick={onRemove}
              className="cursor-pointer border-0 bg-transparent p-0 font-heading text-[11px] font-bold tracking-[0.02em] text-red uppercase hover:underline"
            >
              Remove
            </button>
          ) : blocker ? (
            <span className="font-sans text-[0.65rem] text-paper/40">{blocker}</span>
          ) : (
            <button
              type="button"
              onClick={() =>
                onAdd({
                  productId: gift.productId,
                  variantSku: variant.sku,
                  name: gift.name,
                  label: variantLabel(variant),
                  image: gift.image,
                  pointsCost: variant.pointsCost,
                })
              }
              className="cursor-pointer rounded border border-gold/60 bg-transparent px-3 py-1 font-heading text-[11px] font-bold tracking-[0.02em] text-gold uppercase hover:bg-gold/10"
            >
              Add gift
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function GiftPicker({
  summary,
  gifts,
  picks,
  onChange,
}: {
  summary: RewardsSummary | null;
  gifts: GiftProduct[] | null;
  picks: GiftPick[];
  onChange: (picks: GiftPick[]) => void;
}) {
  if (!summary || !gifts) return <p className="m-0 text-paper/40">Loading your points…</p>;
  if (gifts.length === 0) return <p className="m-0 text-paper/50">No reward gifts are available right now.</p>;

  const used = picks.reduce((n, p) => n + p.pointsCost, 0);
  const remaining = summary.balance - used;

  return (
    <div className="flex flex-col gap-3">
      <p className="m-0 text-paper/60">
        You have <span className="font-bold text-gold">{formatPoints(summary.balance)}</span>
        {summary.pending > 0 && <> ({formatPoints(summary.pending)} pending)</>}. Gifts ship free with this order;
        points aren&apos;t taken off the bill.
        {used > 0 && (
          <>
            {" "}
            Using {formatPoints(used)}, {formatPoints(remaining)} left.
          </>
        )}
      </p>
      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {gifts.map((gift) => {
          const picked = picks.find((p) => p.productId === gift.productId);
          return (
            <GiftCard
              key={gift.productId}
              gift={gift}
              summary={summary}
              remaining={remaining}
              picked={picked}
              onAdd={(pick) => onChange([...picks, pick])}
              onRemove={() => onChange(picks.filter((p) => p.productId !== gift.productId))}
            />
          );
        })}
      </ul>
    </div>
  );
}
