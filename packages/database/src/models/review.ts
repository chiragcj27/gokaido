import { mongoose } from "../client.js";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface IReview {
  product: mongoose.Types.ObjectId;
  // Absent for reviews an admin enters manually on a customer's behalf (e.g.
  // one collected over phone/WhatsApp) — see guestName below for that case.
  user?: mongoose.Types.ObjectId;
  // Absent for the same admin-manual case; every customer-submitted review
  // (via POST /api/reviews) has a real order, enforced at the controller level.
  order?: mongoose.Types.ObjectId;
  // Freeform reviewer name for an admin-manual review with no linked account.
  guestName?: string;
  // Which admin manually created this review, if any (unset for
  // customer-submitted reviews).
  createdBy?: mongoose.Types.ObjectId;

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
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    guestName: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    rating: { type: Number, required: true, min: 1, max: 5 },
    title: String,
    body: String,
    mediaUrls: [{ type: String }],

    isVerifiedPurchase: { type: Boolean, default: false },

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
// One review per order item. A plain `sparse` index only skips a document
// when it's missing *every* indexed field — since `product` is always
// present, admin-manual reviews (no `order`) would still collide with each
// other under `sparse`. A partial index scoped to "has an order" is the
// correct tool: it only enforces uniqueness where `order` actually exists.
reviewSchema.index(
  { order: 1, product: 1 },
  { unique: true, partialFilterExpression: { order: { $exists: true } } }
);

export const Review =
  mongoose.models.Review ?? mongoose.model<IReview>("Review", reviewSchema);
