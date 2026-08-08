import { mongoose } from "../client.js";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  variantImage: string;
  quantity: number;
  unitPrice: number;
}

export interface ICart {
  // Either user (logged in) or guestId (anonymous)
  user?: mongoose.Types.ObjectId;
  guestId?: string;

  items: ICartItem[];

  appliedCoupon?: string;
  rewardPointsToRedeem: number;

  // TTL index will remove abandoned guest carts after 30 days
  expiresAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new mongoose.Schema<ICartItem>(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: { type: String, required: true },
    variantSku: { type: String, required: true },
    variantColor: { type: String, required: true },
    variantSize: { type: String, required: true },
    variantImage: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema<ICart>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", sparse: true },
    guestId: { type: String, sparse: true },

    items: [cartItemSchema],

    appliedCoupon: String,
    rewardPointsToRedeem: { type: Number, default: 0 },

    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

cartSchema.index({ user: 1 }, { sparse: true });
cartSchema.index({ guestId: 1 }, { sparse: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart =
  mongoose.models.Cart ?? mongoose.model<ICart>("Cart", cartSchema);
