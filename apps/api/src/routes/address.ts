import express, { Router } from "express";
import {
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth);

router.get("/", listAddresses);
router.post("/", createAddress);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
