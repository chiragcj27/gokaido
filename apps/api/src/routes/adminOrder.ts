import express, { Router } from "express";
import { adminListOrders, adminGetOrder, adminUpdateOrder } from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", adminListOrders);
router.get("/:id", adminGetOrder);
router.patch("/:id", adminUpdateOrder);

export default router;
