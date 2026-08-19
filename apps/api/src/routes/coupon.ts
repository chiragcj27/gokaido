import express, { Router } from "express";
import {
  listCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deactivateCoupon,
} from "../controllers/coupon.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", listCoupons);
router.get("/:id", getCoupon);
router.post("/", createCoupon);
router.patch("/:id", updateCoupon);
router.delete("/:id", deactivateCoupon);

export default router;
