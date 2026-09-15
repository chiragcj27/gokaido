import express, { Router } from "express";
import {
  listReviews,
  createReview,
  approveReview,
  rejectReview,
} from "../controllers/adminReview.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", listReviews);
router.post("/", createReview);
router.patch("/:id/approve", approveReview);
router.patch("/:id/reject", rejectReview);

export default router;
