// Reward points ledger — rules live in ../utils/rewardPoints.ts.
//
// Every credit is a batch (a RewardTransaction with status/remaining/
// expiresAt), so points can expire one purchase at a time and spending can
// draw from the soonest-to-expire batch first. User.rewardPoints is kept equal
// to the sum of `remaining` over the user's *available* batches; every write
// below that touches one also touches the other in the same transaction.
//
// Lifecycle of an order's points:
//   payment success → creditOrderPoints   (pending batch; referral qualifies)
//   shipped         → releaseOrderPoints  (pending → available, balance += remaining)
//   cancel / refund → reverseOrderPoints  (pending → void, or claw back what's left)
// Gift redemption:
//   checkout        → redeemPoints        (inside the stock-reservation transaction)
//   payment failed / cancelled → restoreRedeemedPoints (back into the same batches)
import {
  Order,
  Product,
  Referral,
  RewardTransaction,
  User,
  mongoose,
  type IOrder,
  type IOrderItem,
  type IProduct,
  type IRewardAllocation,
  type RewardTier,
} from "@gokaido/database";
import {
  EXPIRING_SOON_DAYS,
  POINTS_VALIDITY_DAYS,
  REFERRAL_BONUS_POINTS,
  REFERRAL_MIN_ORDER_VALUE,
  TIER_RULES,
  TIER_WINDOW_DAYS,
  calculatePointsEarned,
  eligibleOrderValue,
  giftPointsCost,
  nextTier,
  pointsExpiryFrom,
  tierForSpend,
  tierRank,
  tierRule,
  tierWindowStart,
} from "../utils/rewardPoints.js";

type ObjectIdLike = mongoose.Types.ObjectId | string;
type OrderRef = Pick<IOrder, "orderNumber" | "subtotal" | "couponDiscount"> & {
  _id: mongoose.Types.ObjectId;
  user?: mongoose.Types.ObjectId;
  payment: Pick<IOrder["payment"], "paidAt">;
};

export class InsufficientPointsError extends Error {
  constructor() {
    super("Not enough reward points available");
  }
}

export class GiftUnavailableError extends Error {}

const DAY_MS = 24 * 60 * 60 * 1000;
const NOT_COUNTED_STATUSES = ["cancelled", "refund_initiated", "refunded"];

function isDuplicateKey(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

async function inTransaction<T>(fn: (session: mongoose.ClientSession) => Promise<T>): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}

async function balanceOf(userId: ObjectIdLike, session?: mongoose.ClientSession): Promise<number> {
  const user = (await User.findById(userId).select("rewardPoints").session(session ?? null).lean()) as
    | { rewardPoints?: number }
    | null;
  return user?.rewardPoints ?? 0;
}

// ---------------------------------------------------------------------------
// Membership tier
// ---------------------------------------------------------------------------

/** Eligible purchases (₹) over the trailing tier window ending at `asOf`. */
export async function eligibleSpend(
  userId: ObjectIdLike,
  asOf = new Date(),
  excludeOrderId?: mongoose.Types.ObjectId
): Promise<number> {
  const match: Record<string, unknown> = {
    user: new mongoose.Types.ObjectId(String(userId)),
    "payment.status": "paid",
    "payment.paidAt": { $gte: tierWindowStart(asOf), $lte: asOf },
    status: { $nin: NOT_COUNTED_STATUSES },
  };
  if (excludeOrderId) match._id = { $ne: excludeOrderId };

  const [row] = await Order.aggregate<{ spend: number }>([
    { $match: match },
    {
      $group: {
        _id: null,
        spend: {
          $sum: { $max: [{ $subtract: ["$subtotal", { $ifNull: ["$couponDiscount", 0] }] }, 0] },
        },
      },
    },
  ]);
  return row?.spend ?? 0;
}

export interface Membership {
  tier: RewardTier;
  label: string;
  pointsPer1000: number;
  spend: number;
  windowDays: number;
  next: { tier: RewardTier; label: string; minSpend: number; spendNeeded: number } | null;
}

export async function getMembership(
  userId: ObjectIdLike,
  asOf = new Date(),
  excludeOrderId?: mongoose.Types.ObjectId
): Promise<Membership> {
  const spend = await eligibleSpend(userId, asOf, excludeOrderId);
  const rule = tierForSpend(spend);
  const next = nextTier(rule.tier);
  return {
    tier: rule.tier,
    label: rule.label,
    pointsPer1000: rule.pointsPer1000,
    spend,
    windowDays: TIER_WINDOW_DAYS,
    next: next
      ? { tier: next.tier, label: next.label, minSpend: next.minSpend, spendNeeded: Math.max(next.minSpend - spend, 0) }
      : null,
  };
}

// ---------------------------------------------------------------------------
// Earning
// ---------------------------------------------------------------------------

/**
 * Called once, when an order's payment succeeds. Records the order's points as
 * a pending batch (released on ship) and, if this is the referee's first
 * qualifying order, a pending referral bonus for whoever referred them. Sets
 * `rewardPointsEarned` / `rewardTier` on the order document — the caller saves it.
 *
 * Idempotent: a unique index on (order, type) over batches means a replayed
 * or racing payment callback can't credit twice.
 */
export async function creditOrderPoints(order: mongoose.HydratedDocument<IOrder>): Promise<void> {
  if (!order.user) return; // guests have no account to credit
  const paidAt = order.payment.paidAt ?? new Date();
  const value = eligibleOrderValue(order);

  const membership = await getMembership(order.user, paidAt, order._id);
  const points = calculatePointsEarned(value, membership.tier);
  order.rewardTier = membership.tier;
  order.rewardPointsEarned = points;

  if (points > 0) {
    try {
      await RewardTransaction.create({
        user: order.user,
        points,
        type: "earned_order",
        description: `Earned on order ${order.orderNumber} (${tierRule(membership.tier).label})`,
        order: order._id,
        status: "pending",
        remaining: points,
        expiresAt: pointsExpiryFrom(paidAt),
        tier: membership.tier,
        balance: await balanceOf(order.user),
      });
    } catch (err) {
      if (!isDuplicateKey(err)) throw err;
    }
  }

  if (value > REFERRAL_MIN_ORDER_VALUE) {
    await qualifyReferral(order, paidAt);
  }
}

async function qualifyReferral(order: OrderRef, paidAt: Date): Promise<void> {
  const referral = await Referral.findOneAndUpdate(
    { referee: order.user, status: "pending" },
    { $set: { status: "qualified", order: order._id } },
    { new: true }
  );
  if (!referral) return;

  try {
    await RewardTransaction.create({
      user: referral.referrer,
      points: REFERRAL_BONUS_POINTS,
      type: "referral_bonus",
      description: "Referral bonus — a friend you referred made their first purchase",
      order: order._id,
      referral: referral._id,
      status: "pending",
      remaining: REFERRAL_BONUS_POINTS,
      expiresAt: pointsExpiryFrom(paidAt),
      balance: await balanceOf(referral.referrer),
    });
  } catch (err) {
    if (!isDuplicateKey(err)) throw err;
  }
}

/** Order shipped (or delivered): its pending batches become spendable. Idempotent. */
export async function releaseOrderPoints(order: { _id: mongoose.Types.ObjectId }): Promise<void> {
  const batches = await RewardTransaction.find({ order: order._id, status: "pending" })
    .select("_id user type referral remaining expiresAt")
    .lean();

  for (const batch of batches) {
    const now = new Date();
    if (batch.expiresAt && batch.expiresAt <= now) {
      // Never released within its validity (order sat unshipped for a year).
      await RewardTransaction.updateOne(
        { _id: batch._id, status: "pending" },
        { $set: { status: "expired", remaining: 0 } }
      );
      continue;
    }

    await inTransaction(async (session) => {
      const released = await RewardTransaction.updateOne(
        { _id: batch._id, status: "pending" },
        { $set: { status: "available", availableAt: now } },
        { session }
      );
      if (released.modifiedCount === 0) return; // already released by a concurrent call

      const user = await User.findByIdAndUpdate(
        batch.user,
        { $inc: { rewardPoints: batch.remaining ?? 0 } },
        { new: true, session }
      ).select("rewardPoints");
      await RewardTransaction.updateOne(
        { _id: batch._id },
        { $set: { balance: user?.rewardPoints ?? 0 } },
        { session }
      );

      if (batch.type === "referral_bonus" && batch.referral) {
        await Referral.updateOne(
          { _id: batch.referral },
          { $set: { status: "completed", completedAt: now, referrerPointsAwarded: batch.remaining ?? 0 } },
          { session }
        );
      }
    });
  }
}

/**
 * Order cancelled or refunded: undo what it earned. A pending batch is simply
 * voided. A released one has whatever is left of it taken back — points
 * already spent on a gift stay spent (there are no returns, so there's no
 * gift to take back). A referral it qualified goes back to pending.
 */
export async function reverseOrderPoints(order: { _id: mongoose.Types.ObjectId; orderNumber: string }): Promise<void> {
  const batches = await RewardTransaction.find({ order: order._id, status: { $in: ["pending", "available", "spent"] } })
    .select("_id user type referral status remaining")
    .lean();

  for (const batch of batches) {
    await inTransaction(async (session) => {
      const voided = await RewardTransaction.updateOne(
        { _id: batch._id, status: batch.status, remaining: batch.remaining },
        { $set: { status: "void", remaining: 0 } },
        { session }
      );
      if (voided.modifiedCount === 0) return; // changed under us — a later call will see the new state

      const clawBack = batch.status === "available" ? (batch.remaining ?? 0) : 0;
      if (clawBack > 0) {
        const user = await User.findByIdAndUpdate(
          batch.user,
          { $inc: { rewardPoints: -clawBack } },
          { new: true, session }
        ).select("rewardPoints");
        await RewardTransaction.create(
          [
            {
              user: batch.user,
              points: -clawBack,
              type: "earn_reversed",
              description:
                batch.type === "referral_bonus"
                  ? `Referral bonus reversed — the qualifying order was cancelled`
                  : `Points reversed — order ${order.orderNumber} was cancelled`,
              order: order._id,
              balance: user?.rewardPoints ?? 0,
            },
          ],
          { session }
        );
      }

      if (batch.type === "referral_bonus" && batch.referral) {
        await Referral.updateOne(
          { _id: batch.referral, order: order._id },
          { $set: { status: "pending", referrerPointsAwarded: 0 }, $unset: { order: "", completedAt: "" } },
          { session }
        );
      }
    });
  }

  // A referral this order qualified whose batch was never created (no-op
  // otherwise) shouldn't stay stuck on "qualified".
  await Referral.updateOne(
    { order: order._id, status: "qualified" },
    { $set: { status: "pending" }, $unset: { order: "" } }
  );
}

// ---------------------------------------------------------------------------
// Redeeming (gifts)
// ---------------------------------------------------------------------------

/**
 * Deducts `points` inside the caller's transaction, drawing from the
 * soonest-expiring batches first. The `$gte` guard on the balance is what
 * stops two concurrent checkouts double-spending it; the transaction makes
 * the balance and batch updates land together or not at all.
 */
export async function redeemPoints(
  order: { _id: mongoose.Types.ObjectId; orderNumber: string },
  userId: ObjectIdLike,
  points: number,
  session: mongoose.ClientSession
): Promise<void> {
  if (points <= 0) return;

  const deducted = await User.updateOne(
    { _id: userId, rewardPoints: { $gte: points } },
    { $inc: { rewardPoints: -points } },
    { session }
  );
  if (deducted.modifiedCount === 0) throw new InsufficientPointsError();

  const batches = await RewardTransaction.find({
    user: userId,
    status: "available",
    remaining: { $gt: 0 },
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: 1, createdAt: 1 })
    .select("_id remaining")
    .session(session)
    .lean<{ _id: mongoose.Types.ObjectId; remaining?: number }[]>();

  let left = points;
  const allocations: IRewardAllocation[] = [];
  for (const batch of batches) {
    if (left === 0) break;
    const take = Math.min(batch.remaining ?? 0, left);
    const fullyUsed = take === batch.remaining;
    await RewardTransaction.updateOne(
      { _id: batch._id },
      { $inc: { remaining: -take }, ...(fullyUsed && { $set: { status: "spent" } }) },
      { session }
    );
    allocations.push({ batch: batch._id, points: take });
    left -= take;
  }
  // Balance said yes but the batches don't cover it — an unswept expiry or
  // a legacy balance. Abort rather than break the balance/batch invariant.
  if (left > 0) throw new InsufficientPointsError();

  await RewardTransaction.create(
    [
      {
        user: userId,
        points: -points,
        type: "redeemed",
        description: `Redeemed for gift${points === 1 ? "" : "s"} on order ${order.orderNumber}`,
        order: order._id,
        allocations,
        balance: await balanceOf(userId, session),
      },
    ],
    { session }
  );
}

/**
 * Puts the points of an order's latest un-reversed redemption back into the
 * batches they came from. Points whose batch has since expired (or been
 * reversed) aren't restored. Idempotent — safe to call from every
 * failure/cancel path.
 */
export async function restoreRedeemedPoints(order: { _id: mongoose.Types.ObjectId; orderNumber: string }): Promise<void> {
  await inTransaction(async (session) => {
    const now = new Date();
    const redemption = await RewardTransaction.findOneAndUpdate(
      { order: order._id, type: "redeemed", reversedAt: { $exists: false } },
      { $set: { reversedAt: now } },
      { sort: { createdAt: -1 }, new: true, session }
    );
    if (!redemption) return;

    let restored = 0;
    for (const allocation of redemption.allocations ?? []) {
      const result = await RewardTransaction.updateOne(
        { _id: allocation.batch, status: { $in: ["available", "spent"] }, expiresAt: { $gt: now } },
        { $inc: { remaining: allocation.points }, $set: { status: "available" } },
        { session }
      );
      if (result.modifiedCount > 0) restored += allocation.points;
    }

    const lost = -redemption.points - restored;
    const user = await User.findByIdAndUpdate(
      redemption.user,
      { $inc: { rewardPoints: restored } },
      { new: true, session }
    ).select("rewardPoints");
    await RewardTransaction.create(
      [
        {
          user: redemption.user,
          points: restored,
          type: "redemption_reversed",
          description:
            `Points returned — order ${order.orderNumber} did not complete` +
            (lost > 0 ? ` (${lost} had expired meanwhile)` : ""),
          order: order._id,
          balance: user?.rewardPoints ?? 0,
        },
      ],
      { session }
    );
  });
}

type LeanGiftProduct = Pick<
  IProduct,
  "name" | "slug" | "cardImage" | "images" | "variants" | "gift" | "isActive"
> & { _id: mongoose.Types.ObjectId };

export interface GiftSelection {
  productId: string;
  variantSku: string;
}

/**
 * Validates the customer's gift picks against the catalogue and their tier,
 * returning ₹0 order lines. Stock is checked later, by the same atomic
 * reservation as paid lines.
 */
export async function buildGiftItems(selections: GiftSelection[], tier: RewardTier): Promise<IOrderItem[]> {
  if (selections.length === 0) return [];
  const products = await Product.find({ _id: { $in: selections.map((s) => s.productId) } })
    .select("name cardImage images variants gift isActive")
    .lean<LeanGiftProduct[]>();

  return selections.map((selection) => {
    const product = products.find((p) => String(p._id) === selection.productId);
    const variant = product?.variants.find((v) => v.sku === selection.variantSku);
    if (!product || !product.isActive || !product.gift?.enabled || !variant || !variant.isActive) {
      throw new GiftUnavailableError("One of the gifts you picked is no longer available");
    }
    if (tierRank(tier) < tierRank(product.gift.minTier ?? "prime")) {
      throw new GiftUnavailableError(`${product.name} is for ${tierRule(product.gift.minTier).label}s and above`);
    }
    if (variant.stock < 1) {
      throw new GiftUnavailableError(`${product.name} (${variant.size}) is out of stock`);
    }
    return {
      product: product._id,
      productName: product.name,
      variantSku: variant.sku,
      variantColor: variant.color,
      variantSize: variant.size,
      variantImage: variant.images?.[0] ?? product.cardImage ?? product.images?.[0] ?? "",
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      isGift: true,
      pointsCost: giftPointsCost(variant.basePrice),
    };
  });
}

export async function listGiftCatalogue() {
  const products = await Product.find({ "gift.enabled": true, isActive: true })
    .select("name slug cardImage images variants gift isActive")
    .sort({ name: 1 })
    .lean<LeanGiftProduct[]>();

  return products
    .map((p) => ({
      productId: String(p._id),
      name: p.name,
      slug: p.slug,
      image: p.cardImage ?? p.images?.[0] ?? "",
      minTier: p.gift?.minTier ?? "prime",
      variants: p.variants
        .filter((v) => v.isActive)
        .map((v) => ({
          sku: v.sku,
          color: v.color,
          size: v.size,
          pointsCost: giftPointsCost(v.basePrice),
          inStock: v.stock > 0,
        })),
    }))
    .filter((p) => p.variants.length > 0);
}

// ---------------------------------------------------------------------------
// Expiry
// ---------------------------------------------------------------------------

/**
 * Expires available batches past their expiresAt. Run lazily before reading
 * or spending a user's balance, and hourly for everyone (startRewardExpirySweep).
 * Safe to run concurrently — each batch is claimed with a guarded update.
 */
export async function expireDuePoints({ userId }: { userId?: ObjectIdLike } = {}): Promise<number> {
  const due = await RewardTransaction.find({
    status: "available",
    expiresAt: { $lte: new Date() },
    ...(userId && { user: userId }),
  })
    .select("_id user remaining expiresAt")
    .limit(500)
    .lean();

  let expired = 0;
  for (const batch of due) {
    await inTransaction(async (session) => {
      const claimed = await RewardTransaction.updateOne(
        { _id: batch._id, status: "available", remaining: batch.remaining },
        { $set: { status: "expired", remaining: 0 } },
        { session }
      );
      if (claimed.modifiedCount === 0 || !batch.remaining) return;

      const user = await User.findByIdAndUpdate(
        batch.user,
        { $inc: { rewardPoints: -batch.remaining } },
        { new: true, session }
      ).select("rewardPoints");
      await RewardTransaction.create(
        [
          {
            user: batch.user,
            points: -batch.remaining,
            type: "expired",
            description: `${batch.remaining} points expired (earned ${POINTS_VALIDITY_DAYS} days earlier)`,
            balance: user?.rewardPoints ?? 0,
          },
        ],
        { session }
      );
      expired += batch.remaining;
    });
  }
  return expired;
}

const SWEEP_INTERVAL_MS = 60 * 60 * 1000;

/** Hourly expiry sweep for long-running (EC2) deployments. */
export function startRewardExpirySweep(): void {
  const run = () =>
    expireDuePoints().catch((err: unknown) => console.error("Reward expiry sweep failed:", err));
  void run();
  setInterval(run, SWEEP_INTERVAL_MS).unref();
}

// ---------------------------------------------------------------------------
// Customer dashboard
// ---------------------------------------------------------------------------

export async function getRewardsSummary(userId: ObjectIdLike) {
  await expireDuePoints({ userId });
  const now = new Date();
  const soon = new Date(now.getTime() + EXPIRING_SOON_DAYS * DAY_MS);

  const [balance, membership, pending, expiring] = await Promise.all([
    balanceOf(userId),
    getMembership(userId, now),
    RewardTransaction.aggregate<{ points: number }>([
      { $match: { user: new mongoose.Types.ObjectId(String(userId)), status: "pending" } },
      { $group: { _id: null, points: { $sum: "$remaining" } } },
    ]),
    RewardTransaction.find({
      user: userId,
      status: "available",
      remaining: { $gt: 0 },
      expiresAt: { $gt: now, $lte: soon },
    })
      .sort({ expiresAt: 1 })
      .select("remaining expiresAt")
      .lean(),
  ]);

  return {
    balance,
    pending: pending[0]?.points ?? 0,
    expiringSoon: expiring.map((b) => ({ points: b.remaining ?? 0, expiresAt: b.expiresAt })),
    membership,
    tiers: TIER_RULES.map(({ tier, label, minSpend, pointsPer1000 }) => ({ tier, label, minSpend, pointsPer1000 })),
    rules: {
      pointValueInr: 1,
      validityDays: POINTS_VALIDITY_DAYS,
      expiringSoonDays: EXPIRING_SOON_DAYS,
      referralBonusPoints: REFERRAL_BONUS_POINTS,
      referralMinOrderValue: REFERRAL_MIN_ORDER_VALUE,
    },
  };
}
