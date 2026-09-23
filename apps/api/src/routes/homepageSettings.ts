import express, { Router } from "express";
import { getHomepageSettings, updateHomepageSettings } from "../controllers/homepageSettings.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

// Public — storefront homepage reads this unauthenticated.
router.get("/", getHomepageSettings);

router.patch("/", requireAuth, requireRole("admin", "superadmin"), updateHomepageSettings);

export default router;
