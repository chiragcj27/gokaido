import type { Request, Response } from "express";
import { presignUploadSchema, UPLOAD_PURPOSES, type UploadPurpose } from "../schemas/upload.schema.js";
import { buildPublicKey, createPresignedUploadUrl, publicUrlForKey } from "../services/s3.js";

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
