import express, { Router } from "express";
import { presignUpload } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router: express.Router = Router();

router.use(requireAuth);

router.post("/presign", presignUpload);

export default router;
