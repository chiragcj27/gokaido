import { mongoose } from "../client.js";

export type UserRole = "customer" | "admin" | "superadmin";
export type Language = "en" | "hi" | "mr" | "ta";

export interface IUser {
  // Set at registration, immutable after that
  name?: string;
  // Required for customer accounts (OTP login); absent for admin/superadmin
  // accounts created via the email+password seed script.
  mobile?: string;

  // Mutable profile fields
  email?: string;
  dob?: Date;
  whatsapp?: string;
  region?: string;
  language: Language;

  role: UserRole;

  // Set only for admin/superadmin accounts — customers authenticate via OTP.
  password?: string;

  referralCode?: string;
  rewardPoints: number;

  wishlist: mongoose.Types.ObjectId[];

  // OTP auth state (cleared after successful login)
  otp?: string;
  otpExpiresAt?: Date;

  notifications: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };

  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String },
    mobile: { type: String, unique: true, sparse: true },

    email: { type: String, lowercase: true, sparse: true },
    dob: Date,
    whatsapp: String,
    region: String,
    language: {
      type: String,
      enum: ["en", "hi", "mr", "ta"],
      default: "en",
    },

    role: {
      type: String,
      enum: ["customer", "admin", "superadmin"],
      default: "customer",
    },

    password: { type: String, select: false },

    referralCode: { type: String, unique: true, sparse: true },
    rewardPoints: { type: Number, default: 0 },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    otp: String,
    otpExpiresAt: Date,

    notifications: {
      whatsapp: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
    },

    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.index({ region: 1 });

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
