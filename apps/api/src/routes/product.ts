import express, { Router } from "express";
import {
  listProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

router.get("/", listProducts);
router.get("/:slug", getProductBySlug);

router.post("/", requireAuth, requireRole("admin", "superadmin"), createProduct);
router.patch("/:id", requireAuth, requireRole("admin", "superadmin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteProduct);

export default router;
