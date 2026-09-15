// Reward point business rules — no rate card exists yet from the client, so
// these are reasonable D2C defaults, not a confirmed spec. Revisit before
// launch: earn rate, redemption value, and the redemption cap are all
// business decisions, not engineering ones.
//
//   Earn:   1 point per ₹100 of order total (after discounts), on payment success.
//   Redeem: 1 point = ₹1, capped at 50% of (subtotal − coupon discount) per order
//           — prevents a coupon + full-points combo from zeroing out an order,
//           which is the usual abuse vector for a referral-funded points balance.
const EARN_RATE_RUPEES_PER_POINT = 100;
const REDEMPTION_VALUE_PER_POINT = 1;
const MAX_REDEMPTION_FRACTION_OF_DISCOUNTED_SUBTOTAL = 0.5;

export function calculatePointsEarned(orderTotal: number): number {
  return Math.floor(orderTotal / EARN_RATE_RUPEES_PER_POINT);
}

export function calculateMaxRedeemableValue(subtotalAfterCoupon: number): number {
  return Math.floor(subtotalAfterCoupon * MAX_REDEMPTION_FRACTION_OF_DISCOUNTED_SUBTOTAL);
}

export function pointsToValue(points: number): number {
  return points * REDEMPTION_VALUE_PER_POINT;
}
