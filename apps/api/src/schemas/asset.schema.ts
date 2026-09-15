import { z } from "zod";
import { isOwnPublicUrl } from "../services/s3.js";

export const createAssetSchema = z.object({
  name: z.string().trim().min(1).max(200),
  url: z.string().url().refine(isOwnPublicUrl, "Must be an uploaded asset URL"),
  key: z.string().trim().min(1),
  contentType: z.string().trim().max(100).optional(),
});

export const assetListQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
