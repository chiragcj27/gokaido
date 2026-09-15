import express, { Router } from "express";
import multer from "multer";
import {
  listProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller.js";
import { bulkUploadProducts, downloadBulkTemplate } from "../controllers/productBulk.controller.js";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";

const router: express.Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

// Registered ahead of `/:slug` so "bulk"/"bulk-template" aren't swallowed as a slug lookup.
router.get(
  "/bulk-template",
  requireAuth,
  requireRole("admin", "superadmin"),
  downloadBulkTemplate
);
router.post(
  "/bulk",
  requireAuth,
  requireRole("admin", "superadmin"),
  upload.single("file"),
  bulkUploadProducts
);

router.get("/", optionalAuth, listProducts);
router.get("/:slug", getProductBySlug);

router.post("/", requireAuth, requireRole("admin", "superadmin"), createProduct);
router.patch("/:id", requireAuth, requireRole("admin", "superadmin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin", "superadmin"), deleteProduct);

export default router;
