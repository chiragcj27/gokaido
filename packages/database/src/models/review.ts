import { mongoose } from "../client.js";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface IReview {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  order: mongoose.Types.ObjectId;

  rating: number;
  title?: string;
  body?: string;
  mediaUrls: string[];

  isVerifiedPurchase: boolean;

  helpfulVotes: number;
  helpfulVotedBy: mongoose.Types.ObjectId[];

  status: ReviewStatus;
  moderatedBy?: mongoose.Types.ObjectId;
  moderatedAt?: Date;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new mongoose.Schema<IReview>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    body: String,
    mediaUrls: [{ type: String }],

    isVerifiedPurchase: { type: Boolean, default: true },

    helpfulVotes: { type: Number, default: 0 },
    helpfulVotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    moderatedAt: Date,
    rejectionReason: String,
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, status: 1 });
reviewSchema.index({ user: 1 });
// One review per order item
reviewSchema.index({ order: 1, product: 1 }, { unique: true });

export const Review =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", reviewSchema);
