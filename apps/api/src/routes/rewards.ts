import express, { Router } from "express";
import { getGiftCatalogue } from "../controllers/rewards.controller.js";

const router: express.Router = Router();

// Public: the reward-gift catalogue (gift-enabled products, points cost per SKU).
router.get("/gifts", getGiftCatalogue);

export default router;
