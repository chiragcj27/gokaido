import express, { Router } from "express";
import {
  listFranchiseEnquiries,
  updateFranchiseEnquiry,
} from "../controllers/adminFranchiseEnquiry.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", listFranchiseEnquiries);
router.patch("/:id", updateFranchiseEnquiry);

export default router;
