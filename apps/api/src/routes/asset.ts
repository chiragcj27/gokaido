import express, { Router } from "express";
import { listAssets, createAsset, deleteAsset } from "../controllers/asset.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/", listAssets);
router.post("/", createAsset);
router.delete("/:id", deleteAsset);

export default router;
