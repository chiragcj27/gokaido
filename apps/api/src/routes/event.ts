import express, { Router } from "express";
import {
  listPublicEvents,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: express.Router = Router();

// Public — the storefront /events page reads this unauthenticated.
router.get("/", listPublicEvents);

router.use(requireAuth, requireRole("admin", "superadmin"));

router.get("/admin", listEvents);
router.post("/", createEvent);
router.patch("/:id", updateEvent);
router.delete("/:id", deleteEvent);

export default router;
