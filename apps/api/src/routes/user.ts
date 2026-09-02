import express, { Router } from "express";
import {
  updateProfile,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getReferralDashboard,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth);

router.patch("/me", updateProfile);
router.get("/me/wishlist", getWishlist);
router.post("/me/wishlist/:productId", addToWishlist);
router.delete("/me/wishlist/:productId", removeFromWishlist);
router.get("/me/referrals", getReferralDashboard);

export default router;
