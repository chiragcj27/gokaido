"use client";

// Reward points + gift catalogue — see apps/api/src/utils/rewardPoints.ts for
// the rules. Points are only ever spent on gifts (₹0 lines at checkout), never
// as a discount on the bill.

import { useCallback, useEffect, useState } from "react";
import { apiRequest, useAuth } from "./auth/authStore";

export type RewardTier = "prime" | "elite" | "gold";

export interface RewardsSummary {
  balance: number;
  pending: number;
  expiringSoon: { points: number; expiresAt: string }[];
  membership: {
    tier: RewardTier;
    label: string;
    pointsPer1000: number;
    spend: number;
    windowDays: number;
    next: { tier: RewardTier; label: string; minSpend: number; spendNeeded: number } | null;
  };
  tiers: { tier: RewardTier; label: string; minSpend: number; pointsPer1000: number }[];
  rules: {
    pointValueInr: number;
    validityDays: number;
    expiringSoonDays: number;
    referralBonusPoints: number;
    referralMinOrderValue: number;
  };
}

export interface RewardTransaction {
  _id: string;
  points: number;
  type: string;
  description: string;
  status?: "pending" | "available" | "void" | "expired" | "spent";
  expiresAt?: string;
  balance: number;
  createdAt: string;
}

export interface GiftProduct {
  productId: string;
  name: string;
  slug: string;
  image: string;
  minTier: RewardTier;
  variants: { sku: string; color: string; size: string; pointsCost: number; inStock: boolean }[];
}

export interface GiftPick {
  productId: string;
  variantSku: string;
  name: string;
  label: string;
  image: string;
  pointsCost: number;
}

const TIER_ORDER: RewardTier[] = ["prime", "elite", "gold"];
export const tierAllows = (held: RewardTier, required: RewardTier) =>
  TIER_ORDER.indexOf(held) >= TIER_ORDER.indexOf(required);

export const formatPoints = (n: number) => `${n.toLocaleString("en-IN")} pts`;

export function useRewardsSummary() {
  const { authFetch, status } = useAuth();
  const [summary, setSummary] = useState<RewardsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (status !== "authenticated") return;
    authFetch<RewardsSummary>("/users/me/rewards")
      .then(setSummary)
      .catch(() => setError("Couldn't load your reward points."));
  }, [authFetch, status]);

  useEffect(load, [load]);
  return { summary, error, reload: load };
}

export function useGiftCatalogue() {
  const [gifts, setGifts] = useState<GiftProduct[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiRequest<{ gifts: GiftProduct[] }>("/rewards/gifts")
      .then(({ gifts }) => !cancelled && setGifts(gifts))
      .catch(() => !cancelled && setGifts([]));
    return () => {
      cancelled = true;
    };
  }, []);
  return gifts;
}
