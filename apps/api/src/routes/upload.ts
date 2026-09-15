import express, { Router } from "express";
import multer from "multer";
import { presignUpload, uploadNormalizedImage } from "../controllers/upload.controller.js";
import { requireAuth } from "../middleware/auth.js";

const router: express.Router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(requireAuth);

router.post("/presign", presignUpload);
router.post("/normalized", upload.single("file"), uploadNormalizedImage);

export default router;
