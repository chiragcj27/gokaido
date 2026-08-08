import { mongoose } from "../client.js";

export type ReferralStatus = "pending" | "completed";

export interface IReferral {
  referrer: mongoose.Types.ObjectId;
  referee: mongoose.Types.ObjectId;
  referralCode: string;

  status: ReferralStatus;

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
      enum: ["pending", "completed"],
      default: "pending",
    },

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
