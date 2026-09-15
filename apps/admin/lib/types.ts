export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  category: string | { _id: string; name: string; slug: string };
  isActive: boolean;
  createdAt: string;
}

export interface Asset {
  _id: string;
  name: string;
  url: string;
  key: string;
  contentType?: string;
  createdAt: string;
}

export interface BulkUploadResult {
  created: string[];
  skipped: { slug: string; reason: string }[];
  errors: { row: number; message: string }[];
}

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  _id: string;
  product: string | { _id: string; name: string; slug: string };
  user?: string | { _id: string; name?: string; mobile: string };
  guestName?: string;
  rating: number;
  title?: string;
  body?: string;
  mediaUrls: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  status: ReviewStatus;
  rejectionReason?: string;
  createdAt: string;
}

export interface ProductVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
  images?: string[];
  isActive?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  sport: string;
  category: string;
  subcategory?: string;
  productType: string;
  description?: string;
  images?: string[];
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refund_initiated"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export interface OrderItem {
  product: string;
  productName: string;
  variantSku: string;
  variantColor: string;
  variantSize: string;
  variantImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface AddressSnapshot {
  name: string;
  mobile: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user?: { _id: string; name?: string; mobile: string; email?: string } | string;
  guestName?: string;
  guestMobile?: string;
  guestEmail?: string;
  items: OrderItem[];
  shippingAddress: AddressSnapshot;
  deliveryInstructions?: string;
  subtotal: number;
  deliveryCharge: number;
  couponCode?: string;
  couponDiscount: number;
  total: number;
  payment: {
    merchantTxnNo?: string;
    txnID?: string;
    paymentID?: string;
    paymentMode?: string;
    status: PaymentStatus;
    paidAt?: string;
  };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  trackingNumber?: string;
  courierPartner?: string;
  createdAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderValue: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}
