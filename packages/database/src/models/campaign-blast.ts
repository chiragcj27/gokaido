import { mongoose } from "../client.js";

export interface ICampaignBlast {
  name: string;
  channel: "whatsapp" | "sms" | "email";

  segment: {
    regions?: string[];
    rewardTiers?: string[];
    purchaseHistory?: "all" | "purchased" | "never_purchased";
    customUserIds?: mongoose.Types.ObjectId[];
  };

  message: string;
  subject?: string;

  scheduledAt?: Date;
  sentAt?: Date;

  status: "draft" | "scheduled" | "sending" | "sent" | "failed";

  stats: {
    totalTargeted: number;
    sent: number;
    failed: number;
  };

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const campaignBlastSchema = new mongoose.Schema<ICampaignBlast>(
  {
    name: { type: String, required: true },
    channel: {
      type: String,
      required: true,
      enum: ["whatsapp", "sms", "email"],
    },

    segment: {
      regions: [String],
      rewardTiers: [String],
      purchaseHistory: {
        type: String,
        enum: ["all", "purchased", "never_purchased"],
        default: "all",
      },
      customUserIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    message: { type: String, required: true },
    subject: String,

    scheduledAt: Date,
    sentAt: Date,

    status: {
      type: String,
      enum: ["draft", "scheduled", "sending", "sent", "failed"],
      default: "draft",
    },

    stats: {
      totalTargeted: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

campaignBlastSchema.index({ status: 1, scheduledAt: 1 });

export const CampaignBlast =
  mongoose.models.CampaignBlast ??
  mongoose.model<ICampaignBlast>("CampaignBlast", campaignBlastSchema);
