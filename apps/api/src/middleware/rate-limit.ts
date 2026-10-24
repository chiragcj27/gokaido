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

// Keyed by email so limit applies per-account, not per-IP
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) =>
    (req.body?.email as string | undefined)?.toLowerCase() ?? ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many failed login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public enquiry forms (franchise sign-up) — per IP, enough for a genuine retry, not for spam.
export const enquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many submissions. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Product search — each new query can cost an OpenAI call (embedding, and an
// LLM parse for long ones), so cap per IP. Generous for a human typing; plain
// listings without `search` aren't counted.
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  skip: (req: Request) => !req.query.search,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many searches. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Search-as-you-type suggestions — no OpenAI cost, but fires on every pause in
// typing, so a looser cap than full searches.
export const suggestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip ?? ""),
  message: { error: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});
