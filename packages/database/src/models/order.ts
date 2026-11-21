import { mongoose } from "../client.js";
import { REWARD_TIERS, type RewardTier } from "./reward-transaction.js";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_initiated"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  variantImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  // Reward gift: shipped at ₹0 (unitPrice/totalPrice 0), paid for with
  // `pointsCost` points. Same SKU and stock as the sellable product.
  isGift?: boolean;
  pointsCost?: number;
}

export interface IAddressSnapshot {
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface IOrder {
  orderNumber: string;
  user?: mongoose.Types.ObjectId;
  guestName?: string;
  guestMobile?: string;
  guestEmail?: string;

  items: IOrderItem[];

  shippingAddress: IAddressSnapshot;
  deliveryInstructions?: string;

  subtotal: number;
  deliveryCharge: number;
  couponCode?: string;
  couponDiscount: number;
  // Points spent on gift items (sum of their pointsCost). Points are never
  // a bill discount, so rewardPointsValue is always 0 on new orders — it
  // only holds the ₹ discount on orders from the old redemption model.
  rewardPointsUsed: number;
  rewardPointsValue: number;
  // Points this order earned, and the tier they were earned at.
  rewardPointsEarned: number;
  rewardTier?: RewardTier;
  total: number;

  payment: {
    gateway: "icici";
    // merchantTxnNo sent on the most recent initiateSale attempt — regenerated
    // on each retry since ICICI requires a unique value per attempt. The
    // permanent, customer-facing identifier is orderNumber, not this.
    merchantTxnNo?: string;
    // Transaction context returned by initiateSale; needed to build the
    // redirect URL for the current in-flight attempt only.
    tranCtx?: string;
    // ICICI's own identifiers for the attempt that actually completed.
    txnID?: string;
    paymentID?: string;
    paymentMode?: string;
    responseCode?: string;
    status: PaymentStatus;
    paidAt?: Date;
  };

  status: OrderStatus;
  statusHistory: {
    status: OrderStatus;
    timestamp: Date;
    note?: string;
  }[];

  trackingNumber?: string;
  courierPartner?: string;
  invoiceUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

const addressSnapshotSchema = new mongoose.Schema<IAddressSnapshot>(
  {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema<IOrderItem>(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    variantSku: { type: String, required: true },
    variantColor: { type: String, required: true },
    variantSize: { type: String, required: true },
    variantImage: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    isGift: { type: Boolean, default: undefined },
    pointsCost: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    guestName: String,
    guestMobile: String,
    guestEmail: String,

    items: [orderItemSchema],
    shippingAddress: { type: addressSnapshotSchema, required: true },
    deliveryInstructions: String,

    subtotal: { type: Number, required: true },
    deliveryCharge: { type: Number, default: 0 },
    couponCode: String,
    couponDiscount: { type: Number, default: 0 },
    rewardPointsUsed: { type: Number, default: 0 },
    rewardPointsValue: { type: Number, default: 0 },
    rewardPointsEarned: { type: Number, default: 0 },
    rewardTier: { type: String, enum: [...REWARD_TIERS] },
    total: { type: Number, required: true },

    payment: {
      gateway: { type: String, enum: ["icici"], default: "icici" },
      merchantTxnNo: String,
      tranCtx: String,
      txnID: String,
      paymentID: String,
      paymentMode: String,
      responseCode: String,
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded", "cancelled"],
        default: "pending",
      },
      paidAt: Date,
    },

    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
        "refund_initiated",
        "refunded",
      ],
      default: "placed",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, required: true },
        note: String,
        _id: false,
      },
    ],

    trackingNumber: String,
    courierPartner: String,
    invoiceUrl: String,
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
// Trailing-year spend for the membership tier.
orderSchema.index({ user: 1, "payment.status": 1, "payment.paidAt": -1 });
orderSchema.index({ "payment.txnID": 1 });

export const Order =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", orderSchema);
