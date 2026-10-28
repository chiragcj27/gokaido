import express, { Router } from "express";
import {
  listSubcategories,
  getSubcategory,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  reorderSubcategories,
} from "../controllers/subcategory.controller.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.get("/", optionalAuth, listSubcategories);
router.get("/:id", optionalAuth, getSubcategory);

router.put("/order", requireAuth, requireRole("admin", "superadmin"), reorderSubcategories);
router.post("/", requireAuth, requireRole("admin", "superadmin"), createSubcategory);
router.patch("/:id", requireAuth, requireRole("admin", "superadmin"), updateSubcategory);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteSubcategory);

export default router;
