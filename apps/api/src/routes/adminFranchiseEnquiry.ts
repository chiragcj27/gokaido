import express, { Router } from "express";
import {
  exportFranchiseEnquiries,
  listFranchiseEnquiries,
  updateFranchiseEnquiry,
} from "../controllers/adminFranchiseEnquiry.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", listFranchiseEnquiries);
router.get("/export", exportFranchiseEnquiries);
router.patch("/:id", updateFranchiseEnquiry);

export default router;
