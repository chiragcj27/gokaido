import type { Request, Response } from "express";
import { Asset, mongoose } from "@gokaido/database";
import { createAssetSchema, assetListQuerySchema } from "../schemas/asset.schema.js";
import { escapeRegex } from "../utils/regex.js";

export async function listAssets(req: Request, res: Response): Promise<void> {
  const parsed = assetListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const { search, page, limit } = parsed.data;
  const filter = search ? { name: new RegExp(escapeRegex(search), "i") } : {};

  const [assets, total] = await Promise.all([
    Asset.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Asset.countDocuments(filter),
  ]);

  res.json({
    assets,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function createAsset(req: Request, res: Response): Promise<void> {
  const parsed = createAssetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid asset data" });
    return;
  }

  const asset = await Asset.create(parsed.data);
  res.status(201).json({ asset });
}

export async function deleteAsset(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid asset id" });
    return;
  }

  const asset = await Asset.findByIdAndDelete(req.params.id);
  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.status(204).send();
}
