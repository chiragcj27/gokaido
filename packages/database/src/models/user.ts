import { mongoose } from "../client.js";

export type UserRole = "customer" | "admin" | "superadmin";
export type Language = "en" | "hi" | "mr" | "ta";

export interface IUser {
  // Immutable after registration
  name: string;
  mobile: string;

  // Mutable profile fields
  email?: string;
  dob?: Date;
  whatsapp?: string;
  region?: string;
  language: Language;

  role: UserRole;

  referralCode: string;
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
    name: { type: String, required: true },
    mobile: { type: String, required: true, unique: true },

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

    referralCode: { type: String, required: true, unique: true },
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
