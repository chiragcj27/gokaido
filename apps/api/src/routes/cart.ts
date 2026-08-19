import express, { Router } from "express";
import {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  mergeGuestCart,
  applyCoupon,
  removeCoupon,
} from "../controllers/cart.controller.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(optionalAuth);

router.get("/", getCart);
router.post("/items", addItem);
router.patch("/items/:productId/:variantSku", updateItemQuantity);
router.delete("/items/:productId/:variantSku", removeItem);
router.delete("/", clearCart);
router.post("/merge", requireAuth, mergeGuestCart);
router.post("/coupon", applyCoupon);
router.delete("/coupon", removeCoupon);

export default router;
