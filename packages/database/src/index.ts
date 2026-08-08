export { connectDB, disconnectDB, mongoose } from "./client.js";

export { Product } from "./models/product.js";
export type { IProduct, IProductVariant, Sport, ProductType } from "./models/product.js";

export { User } from "./models/user.js";
export type { IUser, UserRole, Language } from "./models/user.js";

export { Address } from "./models/address.js";
export type { IAddress } from "./models/address.js";

export { Order } from "./models/order.js";
export type { IOrder, IOrderItem, IAddressSnapshot, OrderStatus, PaymentStatus } from "./models/order.js";

export { Cart } from "./models/cart.js";
export type { ICart, ICartItem } from "./models/cart.js";

export { Review } from "./models/review.js";
export type { IReview, ReviewStatus } from "./models/review.js";

export { Coupon } from "./models/coupon.js";
export type { ICoupon, CouponType } from "./models/coupon.js";

export { RewardTransaction } from "./models/reward-transaction.js";
export type { IRewardTransaction, RewardTransactionType } from "./models/reward-transaction.js";

export { Referral } from "./models/referral.js";
export type { IReferral, ReferralStatus } from "./models/referral.js";

export { Notification } from "./models/notification.js";
export type { INotification, NotificationChannel, NotificationType } from "./models/notification.js";

export { CampaignBlast } from "./models/campaign-blast.js";
export type { ICampaignBlast } from "./models/campaign-blast.js";

export { BlogPost } from "./models/blog-post.js";
export type { IBlogPost } from "./models/blog-post.js";
