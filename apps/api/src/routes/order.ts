import express, { Router } from "express";
import {
  createOrder,
  paymentReturn,
  paymentAdvice,
  listMyOrders,
  getOrder,
  checkPaymentStatus,
  retryPayment,
  cancelOrder,
} from "../controllers/order.controller.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router: express.Router = Router();

const urlencoded = express.urlencoded({ extended: true });

// ICICI posts these as a browser form-redirect and a server-to-server advice
// respectively — both application/x-www-form-urlencoded, both public/unauthenticated
// since the bank can't hold our session token. Authenticity comes from secureHash.
router.post("/payment-return", urlencoded, paymentReturn);
router.post("/payment-advice", urlencoded, paymentAdvice);

router.post("/", optionalAuth, createOrder);
router.get("/", requireAuth, listMyOrders);
router.get("/:id", requireAuth, getOrder);
router.get("/:id/check-status", requireAuth, checkPaymentStatus);
router.post("/:id/retry-payment", requireAuth, retryPayment);
router.post("/:id/cancel", requireAuth, cancelOrder);

export default router;
