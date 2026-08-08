import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

// Keyed by mobile number so limit applies per-phone, not per-IP
export const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  keyGenerator: (req: Request) =>
    (req.body?.mobile as string | undefined) ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many OTP requests. Please wait 10 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) =>
    (req.body?.mobile as string | undefined) ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many failed attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});
