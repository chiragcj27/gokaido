import express, { Router } from "express";
import { getAttentionCounts, getDashboard } from "../controllers/adminDashboard.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", getDashboard);
router.get("/attention", getAttentionCounts);

export default router;
