import express, { Router } from "express";
import { getCollection } from "../controllers/collection.controller.js";

const router: express.Router = Router();

// Public, unauthenticated: the storefront's server-side fetch caches it.
router.get("/:category", getCollection);

export default router;
