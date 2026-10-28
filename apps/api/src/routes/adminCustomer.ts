import express, { Router } from "express";
import { exportCustomers, listCustomers } from "../controllers/adminCustomer.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", listCustomers);
router.get("/export", exportCustomers);

export default router;
