import express, { Router } from "express";
import { getGoogleShoppingFeed } from "../controllers/feed.controller.js";

const router: express.Router = Router();

// Public and unauthenticated — Google's Merchant Center fetcher (and anyone
// else) needs to be able to GET this without a token.
router.get("/google-shopping.xml", getGoogleShoppingFeed);

export default router;
