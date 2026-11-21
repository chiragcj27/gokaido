import { mongoose } from "../client.js";

// Retail membership tier (see apps/api/src/utils/rewardPoints.ts for the
// spend thresholds and earn rates).
export type RewardTier = "prime" | "elite" | "gold";
export const REWARD_TIERS: readonly RewardTier[] = ["prime", "elite", "gold"];

export type RewardTransactionType =
  | "earned_order"
  | "earn_reversed"
  | "redeemed"
  | "redemption_reversed"
  | "referral_bonus"
  | "signup_bonus"
  | "expired"
  | "admin_adjustment";

// Credit transactions (earned_order, referral_bonus, positive
// admin_adjustment) are also *batches*: each one expires on its own
// `expiresAt`, and `remaining` tracks how much of it is still unspent.
//   pending   — earned on an order that hasn't shipped yet; not spendable
//               and not in User.rewardPoints
//   available — spendable; `remaining` counts towards User.rewardPoints
//   void      — the order was cancelled/refunded before the batch released
//   expired   — hit expiresAt with points left over (written by the sweep)
//   spent     — fully used (remaining reached 0)
// Invariant: User.rewardPoints == sum(remaining) of the user's available batches.
export type RewardBatchStatus = "pending" | "available" | "void" | "expired" | "spent";

export interface IRewardAllocation {
  batch: mongoose.Types.ObjectId;
  points: number;
}

export interface IRewardTransaction {
  user: mongoose.Types.ObjectId;
  // Positive = earned, negative = redeemed/expired/reversed
  points: number;
  type: RewardTransactionType;
  description: string;
  order?: mongoose.Types.ObjectId;
  referral?: mongoose.Types.ObjectId;

  // Batch fields — credits only.
  status?: RewardBatchStatus;
  remaining?: number;
  expiresAt?: Date;
  availableAt?: Date;
  // Tier the points were earned at (earned_order only).
  tier?: RewardTier;

  // Redemption fields — which batches a "redeemed" entry drew from, so a
  // reversal puts the points back into the same batches (same expiry).
  allocations?: IRewardAllocation[];
  reversedAt?: Date;

  // Available balance after this transaction (for a pending credit: the
  // balance when it was recorded, refreshed when it releases).
  balance: number;
  createdAt: Date;
}

const rewardTransactionSchema = new mongoose.Schema<IRewardTransaction>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    points: { type: Number, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "earned_order",
        "earn_reversed",
        "redeemed",
        "redemption_reversed",
        "referral_bonus",
        "signup_bonus",
        "expired",
        "admin_adjustment",
      ],
    },
    description: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    referral: { type: mongoose.Schema.Types.ObjectId, ref: "Referral" },

    status: { type: String, enum: ["pending", "available", "void", "expired", "spent"] },
    remaining: { type: Number, min: 0 },
    expiresAt: Date,
    availableAt: Date,
    tier: { type: String, enum: [...REWARD_TIERS] },

    allocations: [
      {
        batch: { type: mongoose.Schema.Types.ObjectId, ref: "RewardTransaction", required: true },
        points: { type: Number, required: true },
        _id: false,
      },
    ],
    reversedAt: Date,

    balance: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

rewardTransactionSchema.index({ user: 1, createdAt: -1 });
// FIFO spend + per-user expiry sweep.
rewardTransactionSchema.index({ user: 1, status: 1, expiresAt: 1 });
// Global expiry sweep.
rewardTransactionSchema.index({ status: 1, expiresAt: 1 });
rewardTransactionSchema.index({ order: 1 }, { sparse: true });
// One credit batch of each type per order — makes crediting idempotent when
// the payment return and advice callbacks race. Only batches have `status`.
rewardTransactionSchema.index(
  { order: 1, type: 1 },
  { unique: true, partialFilterExpression: { status: { $exists: true }, order: { $exists: true } } }
);

export const RewardTransaction =
  mongoose.models.RewardTransaction ??
  mongoose.model<IRewardTransaction>(
    "RewardTransaction",
    rewardTransactionSchema
  );
