import express, { Router, type Request, type Response } from "express";
import { z } from "zod";
import { User, Referral, RewardTransaction } from "@gokaido/database";
import { generateOtp, hashOtp, generateReferralCode } from "../utils/otp.js";
import {
  signAccessToken,
  signRefreshToken,
  signTempToken,
  verifyRefreshToken,
  verifyTempToken,
} from "../utils/jwt.js";
import { sendOtpSms } from "../services/sms.js";
import { requireAuth } from "../middleware/auth.js";
import { otpSendLimiter, otpVerifyLimiter } from "../middleware/rate-limit.js";

const router: express.Router = Router();

const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number (must be 10 digits starting with 6-9)");

const otpSchema = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

const nameSchema = z.string().min(2).max(50).trim();

// POST /api/auth/otp/send
router.post(
  "/otp/send",
  otpSendLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const parsed = mobileSchema.safeParse(req.body.mobile);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid mobile" });
      return;
    }

    const mobile = parsed.data;
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { mobile },
      { otp: hashOtp(otp), otpExpiresAt },
      { upsert: true, new: true }
    );

    await sendOtpSms(mobile, otp);

    res.json({
      message: "OTP sent successfully",
      isNewUser: !user.name,
    });
  }
);

// POST /api/auth/otp/verify
router.post(
  "/otp/verify",
  otpVerifyLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const mobileParsed = mobileSchema.safeParse(req.body.mobile);
    const otpParsed = otpSchema.safeParse(req.body.otp);

    if (!mobileParsed.success || !otpParsed.success) {
      res.status(400).json({ error: "Invalid mobile number or OTP format" });
      return;
    }

    const mobile = mobileParsed.data;
    const otp = otpParsed.data;

    const user = await User.findOne({ mobile });

    if (!user?.otp || !user.otpExpiresAt) {
      res.status(400).json({ error: "OTP not found. Please request a new one." });
      return;
    }

    if (user.otpExpiresAt < new Date()) {
      res.status(400).json({ error: "OTP has expired. Please request a new one." });
      return;
    }

    if (user.otp !== hashOtp(otp)) {
      res.status(400).json({ error: "Incorrect OTP." });
      return;
    }

    // Clear OTP fields after successful verification
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // New user — no name yet, needs to complete registration
    if (!user.name) {
      const tempToken = signTempToken(mobile);
      res.json({ isNewUser: true, tempToken });
      return;
    }

    res.json({
      isNewUser: false,
      accessToken: signAccessToken(String(user._id)),
      refreshToken: signRefreshToken(String(user._id)),
      user: toPublicUser(user),
    });
  }
);

// POST /api/auth/register
// Completes profile for a new user using the temp token from OTP verify
router.post("/register", async (req: Request, res: Response): Promise<void> => {
  const tempToken = req.headers.authorization?.replace("Bearer ", "");
  if (!tempToken) {
    res.status(401).json({ error: "Registration token required" });
    return;
  }

  let mobile: string;
  try {
    ({ mobile } = verifyTempToken(tempToken));
  } catch {
    res.status(401).json({ error: "Invalid or expired registration token. Please verify OTP again." });
    return;
  }

  const nameParsed = nameSchema.safeParse(req.body.name);
  if (!nameParsed.success) {
    res.status(400).json({ error: "Name must be between 2 and 50 characters" });
    return;
  }

  const user = await User.findOne({ mobile });
  if (!user) {
    res.status(404).json({ error: "User not found. Please restart the login flow." });
    return;
  }

  if (user.name) {
    res.status(400).json({ error: "Account already registered. Please log in." });
    return;
  }

  // Generate a unique referral code
  let referralCode = generateReferralCode();
  while (await User.exists({ referralCode })) {
    referralCode = generateReferralCode();
  }

  user.name = nameParsed.data;
  user.referralCode = referralCode;
  await user.save();

  // Handle referral — award signup bonus to both referrer and new user
  const usedCode = typeof req.body.referralCode === "string"
    ? (req.body.referralCode as string).trim().toUpperCase()
    : null;

  if (usedCode) {
    const referrer = await User.findOne({ referralCode: usedCode });
    if (referrer && String(referrer._id) !== String(user._id)) {
      const REFERRER_POINTS = 100;
      const REFEREE_POINTS = 50;

      await Referral.create({
        referrer: referrer._id,
        referee: user._id,
        referralCode: usedCode,
        referrerPointsAwarded: REFERRER_POINTS,
        refereePointsAwarded: REFEREE_POINTS,
      });

      // Credit referrer
      referrer.rewardPoints += REFERRER_POINTS;
      await referrer.save();
      await RewardTransaction.create({
        user: referrer._id,
        points: REFERRER_POINTS,
        type: "referral_bonus",
        description: `Referral bonus — ${user.name} joined using your code`,
        balance: referrer.rewardPoints,
      });

      // Credit new user (signup bonus)
      user.rewardPoints += REFEREE_POINTS;
      await user.save();
      await RewardTransaction.create({
        user: user._id,
        points: REFEREE_POINTS,
        type: "referral_bonus",
        description: `Welcome bonus — joined via referral code ${usedCode}`,
        balance: user.rewardPoints,
      });
    }
  }

  res.status(201).json({
    accessToken: signAccessToken(String(user._id)),
    refreshToken: signRefreshToken(String(user._id)),
    user: toPublicUser(user),
  });
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(refreshToken);
    type Pick = { _id: unknown; isActive: boolean };
    const user = (await User.findById(payload.sub)
      .select("_id isActive")
      .lean()) as Pick | null;

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.json({ accessToken: signAccessToken(String(user._id)) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
});

// GET /api/auth/me
router.get(
  "/me",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const user = await User.findById(req.user!.id)
      .select("-otp -otpExpiresAt")
      .lean();

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  }
);

function toPublicUser(user: { _id: unknown; name?: string; mobile: string; email?: string; region?: string; language: string; rewardPoints: number; referralCode?: string; role: string }) {
  return {
    id: user._id,
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    region: user.region,
    language: user.language,
    rewardPoints: user.rewardPoints,
    referralCode: user.referralCode,
    role: user.role,
  };
}

export default router;
