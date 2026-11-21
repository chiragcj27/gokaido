// Reward programme rules — retail customers (the only kind the website
// serves; coach/wholesale go to the app). Confirmed by the client in the
// "Gokaido Rewards Programme" doc, Nov 2026. Same rules as the app's retail
// programme, but run separately: website balance and tier are not synced.
//
//   Tier:    eligible purchases over the trailing 1 year.
//              Prime  ₹0 – ₹50,000          50 points per ₹1,000
//              Elite  ₹50,001 – ₹2,00,000   75 points per ₹1,000
//              Gold   ₹2,00,001 and above   100 points per ₹1,000
//            Pro-rata: ₹900 at Prime earns 45.
//   Expiry:  each order's points expire 1 year after that purchase.
//   Redeem:  gifts only — never a bill discount, never cash. 1 point = ₹1 of
//            gift value; a gift ships at ₹0 alongside at least one paid item.
//   Referral: 20 points to the referrer once the referee pays for an order
//            above ₹2,000. Nothing for the referee, nothing at signup.
//   No returns (client policy); cancelled/refunded orders reverse their points.
//
// Engineering choices the doc doesn't settle:
//   • "Eligible purchase" = subtotal − coupon discount of paid orders that
//     aren't cancelled/refunded. Shipping and ₹0 gift lines don't count.
//   • The tier an order earns at is the one the customer held *before* that
//     order (its own value doesn't count towards its own rate).
//   • Points are pending until the order ships, so an order can't be
//     cancelled after its points were spent on a gift.
import type { RewardTier } from "@gokaido/database";

export interface TierRule {
  tier: RewardTier;
  label: string;
  // Lowest trailing-year spend (₹, inclusive) that reaches this tier.
  minSpend: number;
  pointsPer1000: number;
}

export const TIER_RULES: readonly TierRule[] = [
  { tier: "prime", label: "Prime Member", minSpend: 0, pointsPer1000: 50 },
  { tier: "elite", label: "Elite Member", minSpend: 50_001, pointsPer1000: 75 },
  { tier: "gold", label: "Gold Member", minSpend: 200_001, pointsPer1000: 100 },
];

export const TIER_WINDOW_DAYS = 365;
export const POINTS_VALIDITY_DAYS = 365;
export const REFERRAL_BONUS_POINTS = 20;
// The referee's order must be strictly above this (₹) to qualify.
export const REFERRAL_MIN_ORDER_VALUE = 2000;
// How far ahead "expiring soon" looks on the customer's rewards dashboard.
export const EXPIRING_SOON_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function tierRule(tier: RewardTier): TierRule {
  return TIER_RULES.find((r) => r.tier === tier) ?? TIER_RULES[0];
}

export function tierRank(tier: RewardTier): number {
  return TIER_RULES.findIndex((r) => r.tier === tier);
}

export function tierForSpend(spend: number): TierRule {
  let current = TIER_RULES[0];
  for (const rule of TIER_RULES) if (spend >= rule.minSpend) current = rule;
  return current;
}

export function nextTier(tier: RewardTier): TierRule | undefined {
  return TIER_RULES[tierRank(tier) + 1];
}

export function calculatePointsEarned(eligibleAmount: number, tier: RewardTier): number {
  if (eligibleAmount <= 0) return 0;
  return Math.floor((eligibleAmount * tierRule(tier).pointsPer1000) / 1000);
}

// What an order contributes to the tier and to earning. Gift lines are ₹0 so
// they're already absent from the subtotal.
export function eligibleOrderValue(order: { subtotal: number; couponDiscount?: number }): number {
  return Math.max(order.subtotal - (order.couponDiscount ?? 0), 0);
}

// 1 point = ₹1 of gift value.
export function giftPointsCost(basePrice: number): number {
  return Math.ceil(basePrice);
}

export function pointsExpiryFrom(earnedAt: Date): Date {
  return new Date(earnedAt.getTime() + POINTS_VALIDITY_DAYS * DAY_MS);
}

export function tierWindowStart(asOf: Date): Date {
  return new Date(asOf.getTime() - TIER_WINDOW_DAYS * DAY_MS);
}
