import { mongoose } from "../client.js";

// pending   — referee signed up, no qualifying purchase yet
// qualified — referee paid for a qualifying order; referrer's bonus is a
//             pending batch until that order ships
// completed — that order shipped, bonus released
// A qualifying order that's cancelled/refunded sends the referral back to
// pending, so a later order can still qualify.
export type ReferralStatus = "pending" | "qualified" | "completed";

export interface IReferral {
  referrer: mongoose.Types.ObjectId;
  referee: mongoose.Types.ObjectId;
  referralCode: string;

  status: ReferralStatus;
  // The referee's order that qualified the referral.
  order?: mongoose.Types.ObjectId;

  referrerPointsAwarded: number;
  refereePointsAwarded: number;

  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new mongoose.Schema<IReferral>(
  {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    referee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    referralCode: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "qualified", "completed"],
      default: "pending",
    },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },

    referrerPointsAwarded: { type: Number, default: 0 },
    refereePointsAwarded: { type: Number, default: 0 },

    completedAt: Date,
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1 });
referralSchema.index({ referralCode: 1 });

export const Referral =
  mongoose.models.Referral ??
  mongoose.model<IReferral>("Referral", referralSchema);
