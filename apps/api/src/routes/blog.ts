import express, { Router } from "express";
import { getPublicBlogPost, listPublicBlogPosts } from "../controllers/blog.controller.js";

const router: express.Router = Router();

// Public — storefront /blogs reads these unauthenticated. Only published posts.
router.get("/", listPublicBlogPosts);
router.get("/:slug", getPublicBlogPost);

export default router;
