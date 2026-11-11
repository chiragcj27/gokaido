import express, { Router } from "express";
import {
  createBlogPost,
  deleteBlogPost,
  getAdminBlogPost,
  getPublicBlogPost,
  listAdminBlogPosts,
  listPublicBlogPosts,
  updateBlogPost,
} from "../controllers/blog.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();
const adminOnly = [requireAuth, requireRole("admin", "superadmin")];

// Admin — registered before "/:slug" so "admin" isn't read as a post slug.
router.get("/admin", ...adminOnly, listAdminBlogPosts);
router.get("/admin/:id", ...adminOnly, getAdminBlogPost);
router.post("/", ...adminOnly, createBlogPost);
router.patch("/:id", ...adminOnly, updateBlogPost);
router.delete("/:id", ...adminOnly, deleteBlogPost);

// Public — storefront /blogs reads these unauthenticated. Only published posts.
router.get("/", listPublicBlogPosts);
router.get("/:slug", getPublicBlogPost);

export default router;
