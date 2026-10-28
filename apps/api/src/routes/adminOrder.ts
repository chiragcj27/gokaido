import express, { Router } from "express";
import {
  adminListOrders,
  adminExportOrders,
  adminGetOrder,
  adminUpdateOrder,
} from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", adminListOrders);
// Registered ahead of `/:id` so "export" isn't treated as an order id.
router.get("/export", adminExportOrders);
router.get("/:id", adminGetOrder);
router.patch("/:id", adminUpdateOrder);

export default router;
