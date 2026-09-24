import express, { Router } from "express";
import {
  listPublicStores,
  listStores,
  createStore,
  updateStore,
  deleteStore,
} from "../controllers/store.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

// Public — storefront homepage reads this unauthenticated.
router.get("/", listPublicStores);

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/admin", listStores);
router.post("/", createStore);
router.patch("/:id", updateStore);
router.delete("/:id", deleteStore);

export default router;
