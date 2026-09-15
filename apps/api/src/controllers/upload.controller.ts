import type { Request, Response } from "express";
import sharp from "sharp";
import { presignUploadSchema, UPLOAD_PURPOSES, type UploadPurpose } from "../schemas/upload.schema.js";
import { buildPublicKey, createPresignedUploadUrl, publicUrlForKey, uploadBufferToS3 } from "../services/s3.js";
import { normalizeCutoutImage } from "../services/imageNormalize.js";

export async function presignUpload(req: Request, res: Response): Promise<void> {
  const parsed = presignUploadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid upload request" });
    return;
  }

  const { purpose, fileName, contentType } = parsed.data;
  const config = UPLOAD_PURPOSES[purpose];

  if (config.roles && !config.roles.includes(req.user!.role as never)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (!config.contentTypes.includes(contentType as never)) {
    res.status(400).json({ error: `Unsupported content type for ${purpose} uploads` });
    return;
  }

  const key = buildPublicKey(config.folder, fileName);
  const uploadUrl = await createPresignedUploadUrl(key, contentType);

  res.json({ uploadUrl, key, publicUrl: publicUrlForKey(key) });
}

// Purposes whose photos feed PoppedCard's pop-out treatment — these get
// trimmed and re-composited onto a canonical canvas so the fixed CSS
// scale/offset it uses looks consistent regardless of the source photo.
const NORMALIZED_PURPOSES = new Set(["product", "category"]);

export async function uploadNormalizedImage(req: Request, res: Response): Promise<void> {
  const purpose = req.body.purpose;
  if (!NORMALIZED_PURPOSES.has(purpose)) {
    res.status(400).json({ error: "Invalid purpose" });
    return;
  }

  const config = UPLOAD_PURPOSES[purpose as UploadPurpose];
  if (config.roles && !config.roles.includes(req.user!.role as never)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const file = req.file;
  if (!file || !config.contentTypes.includes(file.mimetype as never)) {
    res.status(400).json({ error: "Invalid or missing file" });
    return;
  }

  const meta = await sharp(file.buffer).metadata();
  if (!meta.hasAlpha) {
    res.status(400).json({ error: "Image must be a transparent-background PNG cutout" });
    return;
  }

  try {
    const normalized = await normalizeCutoutImage(file.buffer);
    const key = buildPublicKey(config.folder, "upload.png");
    await uploadBufferToS3(key, normalized, "image/png");
    res.json({ publicUrl: publicUrlForKey(key), key });
  } catch {
    res.status(400).json({ error: "Could not process image" });
  }
}
