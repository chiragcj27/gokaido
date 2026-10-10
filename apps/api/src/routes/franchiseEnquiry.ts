import express, { Router } from "express";
import { createFranchiseEnquiry } from "../controllers/franchiseEnquiry.controller.js";
import { enquiryLimiter } from "../middleware/rate-limit.js";

const router: express.Router = Router();

router.post("/", enquiryLimiter, createFranchiseEnquiry);

export default router;
