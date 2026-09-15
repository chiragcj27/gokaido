import express, { Router } from "express";
import { listProductReviews, createReview, toggleHelpful } from "../controllers/review.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.get("/", listProductReviews);
router.post("/", requireAuth, createReview);
router.post("/:id/helpful", requireAuth, toggleHelpful);

export default router;
