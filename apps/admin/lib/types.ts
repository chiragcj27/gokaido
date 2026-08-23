export interface ProductVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
  basePrice: number;
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
  variants: ProductVariant[];
  isActive: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  avgRating: number;
  reviewCount: number;
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
