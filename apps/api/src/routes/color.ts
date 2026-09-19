import express, { Router } from "express";
import { listColors, getColor, createColor, updateColor, deleteColor } from "../controllers/color.controller.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.get("/", optionalAuth, listColors);
router.get("/:id", optionalAuth, getColor);

router.post("/", requireAuth, requireRole("admin", "superadmin"), createColor);
router.patch("/:id", requireAuth, requireRole("admin", "superadmin"), updateColor);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteColor);

export default router;
