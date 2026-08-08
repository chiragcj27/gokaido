import { z } from "zod";

export const mobileSchema = z
  .string()
  .regex(
    /^[6-9]\d{9}$/,
    "Invalid Indian mobile number (must be 10 digits starting with 6-9)"
  );

export const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

export const nameSchema = z.string().min(2).max(50).trim();

export const sendOtpSchema = z.object({
  mobile: mobileSchema,
});

export const verifyOtpSchema = z.object({
  mobile: mobileSchema,
  otp: otpSchema,
});

export const registerSchema = z.object({
  name: nameSchema,
  referralCode: z.string().trim().toUpperCase().optional(),
});
