import express, { Router } from "express";
import {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.get("/", optionalAuth, listCategories);
router.get("/:id", optionalAuth, getCategory);

router.post("/", requireAuth, requireRole("admin", "superadmin"), createCategory);
router.patch("/:id", requireAuth, requireRole("admin", "superadmin"), updateCategory);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteCategory);

export default router;
