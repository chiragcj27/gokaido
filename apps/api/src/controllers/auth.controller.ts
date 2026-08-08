import type { Request, Response } from "express";
import { User, Referral, RewardTransaction, mongoose, type IUser } from "@gokaido/database";
import { generateOtp, hashOtp, generateReferralCode } from "../utils/otp.js";
import {
  signAccessToken,
  signRefreshToken,
  signTempToken,
  verifyRefreshToken,
  verifyTempToken,
} from "../utils/jwt.js";
import { sendOtpSms } from "../services/sms.js";
import {
  sendOtpSchema,
  verifyOtpSchema,
  registerSchema,
} from "../schemas/auth.schema.js";

const REFERRER_POINTS = 100;
const REFEREE_POINTS = 50;
const OTP_TTL_MS = 10 * 60 * 1000;

export async function sendOtp(req: Request, res: Response): Promise<void> {
  const parsed = sendOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid request" });
    return;
  }

  const { mobile } = parsed.data;
  const otp = generateOtp();

  const user = await User.findOneAndUpdate(
    { mobile },
    { otp: hashOtp(otp), otpExpiresAt: new Date(Date.now() + OTP_TTL_MS) },
    { upsert: true, new: true }
  );

  await sendOtpSms(mobile, otp);

  res.json({ message: "OTP sent successfully", isNewUser: !user.name });
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid mobile number or OTP format" });
    return;
  }

  const { mobile, otp } = parsed.data;
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

  user.otp = undefined;
  user.otpExpiresAt = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  if (!user.name) {
    res.json({ isNewUser: true, tempToken: signTempToken(mobile) });
    return;
  }

  const userId = String(user._id);
  res.json({
    isNewUser: false,
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
    user: toPublicUser(user),
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  const tempToken = req.headers.authorization?.replace("Bearer ", "");
  if (!tempToken) {
    res.status(401).json({ error: "Registration token required" });
    return;
  }

  let mobile: string;
  try {
    ({ mobile } = verifyTempToken(tempToken));
  } catch {
    res
      .status(401)
      .json({ error: "Invalid or expired registration token. Please verify OTP again." });
    return;
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Name must be between 2 and 50 characters" });
    return;
  }

  const { name, referralCode: usedCode } = parsed.data;

  const user = await User.findOne({ mobile }) as mongoose.HydratedDocument<IUser> | null;
  if (!user) {
    res.status(404).json({ error: "User not found. Please restart the login flow." });
    return;
  }

  if (user.name) {
    res.status(400).json({ error: "Account already registered. Please log in." });
    return;
  }

  // Generate a unique referral code for the new user
  let referralCode = generateReferralCode();
  while (await User.exists({ referralCode })) {
    referralCode = generateReferralCode();
  }

  user.name = name;
  user.referralCode = referralCode;
  await user.save();

  if (usedCode) {
    await applyReferral(usedCode, user);
  }

  const userId = String(user._id);
  res.status(201).json({
    accessToken: signAccessToken(userId),
    refreshToken: signRefreshToken(userId),
    user: toPublicUser(user),
  });
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body as { refreshToken?: string };
  if (!token) {
    res.status(400).json({ error: "refreshToken is required" });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    type Pick = { _id: unknown; isActive: boolean };
    const user = (await User.findById(payload.sub)
      .select("_id isActive")
      .lean()) as Pick | null;

    if (!user?.isActive) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    res.json({ accessToken: signAccessToken(String(user._id)) });
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.user!.id)
    .select("-otp -otpExpiresAt")
    .lean();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ user });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function applyReferral(
  usedCode: string,
  newUser: mongoose.HydratedDocument<IUser>
) {
  const referrer = await User.findOne({ referralCode: usedCode });
  if (!referrer || String(referrer._id) === String(newUser._id)) return;

  await Referral.create({
    referrer: referrer._id,
    referee: newUser._id,
    referralCode: usedCode,
    referrerPointsAwarded: REFERRER_POINTS,
    refereePointsAwarded: REFEREE_POINTS,
  });

  referrer.rewardPoints += REFERRER_POINTS;
  await referrer.save();
  await RewardTransaction.create({
    user: referrer._id,
    points: REFERRER_POINTS,
    type: "referral_bonus",
    description: `Referral bonus — ${newUser.name} joined using your code`,
    balance: referrer.rewardPoints,
  });

  newUser.rewardPoints += REFEREE_POINTS;
  await newUser.save();
  await RewardTransaction.create({
    user: newUser._id,
    points: REFEREE_POINTS,
    type: "referral_bonus",
    description: `Welcome bonus — joined via referral code ${usedCode}`,
    balance: newUser.rewardPoints,
  });
}

type PublicUserSource = {
  _id: unknown;
  name?: string;
  mobile: string;
  email?: string;
  region?: string;
  language: string;
  rewardPoints: number;
  referralCode?: string;
  role: string;
};

function toPublicUser(user: PublicUserSource) {
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
