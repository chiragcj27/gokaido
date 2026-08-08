import { mongoose } from "../client.js";

export type RewardTransactionType =
  | "earned_order"
  | "redeemed"
  | "referral_bonus"
  | "signup_bonus"
  | "expired"
  | "admin_adjustment";

export interface IRewardTransaction {
  user: mongoose.Types.ObjectId;
  // Positive = earned, negative = redeemed/expired
  points: number;
  type: RewardTransactionType;
  description: string;
  order?: mongoose.Types.ObjectId;
  referral?: mongoose.Types.ObjectId;
  expiresAt?: Date;
  // Running balance after this transaction
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
        "redeemed",
        "referral_bonus",
        "signup_bonus",
        "expired",
        "admin_adjustment",
      ],
    },
    description: { type: String, required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    referral: { type: mongoose.Schema.Types.ObjectId, ref: "Referral" },
    expiresAt: Date,
    balance: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

rewardTransactionSchema.index({ user: 1, createdAt: -1 });
rewardTransactionSchema.index({ expiresAt: 1 }, { sparse: true });

export const RewardTransaction =
  mongoose.models.RewardTransaction ??
  mongoose.model<IRewardTransaction>(
    "RewardTransaction",
    rewardTransactionSchema
  );
