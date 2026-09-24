import express, { Router } from "express";
import { listPublicReels, listReels, createReel, updateReel, deleteReel } from "../controllers/reel.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

// Public — storefront homepage reads this unauthenticated.
router.get("/", listPublicReels);

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/admin", listReels);
router.post("/", createReel);
router.patch("/:id", updateReel);
router.delete("/:id", deleteReel);

export default router;
