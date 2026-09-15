import express, { Router } from "express";
import {
  sendOtp,
  verifyOtp,
  register,
  adminLogin,
  refreshToken,
  getMe,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import {
  otpSendLimiter,
  otpVerifyLimiter,
  adminLoginLimiter,
} from "../middleware/rate-limit.js";

const router: express.Router = Router();

router.post("/otp/send", otpSendLimiter, sendOtp);
router.post("/otp/verify", otpVerifyLimiter, verifyOtp);
router.post("/register", register);
router.post("/admin/login", adminLoginLimiter, adminLogin);
router.post("/refresh", refreshToken);
router.get("/me", requireAuth, getMe);

export default router;
