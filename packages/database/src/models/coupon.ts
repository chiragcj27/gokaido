import { mongoose } from "../client.js";

export type CouponType = "percentage" | "fixed";

export interface ICoupon {
  code: string;
  type: CouponType;
  value: number;

  minOrderValue: number;
  maxDiscount?: number;

  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;

  applicableProducts: mongoose.Types.ObjectId[];
  applicableCategories: string[];

  validFrom: Date;
  validUntil: Date;

  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new mongoose.Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, required: true, enum: ["percentage", "fixed"] },
    value: { type: Number, required: true },

    minOrderValue: { type: Number, default: 0 },
    maxDiscount: Number,

    usageLimit: Number,
    usedCount: { type: Number, default: 0 },
    perUserLimit: { type: Number, default: 1 },

    applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    applicableCategories: [{ type: String }],

    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },

    isActive: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

couponSchema.index({ validUntil: 1, isActive: 1 });

export const Coupon =
  mongoose.models.Coupon ?? mongoose.model<ICoupon>("Coupon", couponSchema);
