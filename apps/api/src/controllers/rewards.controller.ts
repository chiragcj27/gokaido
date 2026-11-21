import type { Request, Response } from "express";
import { listGiftCatalogue } from "../services/rewards.js";

export async function getGiftCatalogue(_req: Request, res: Response): Promise<void> {
  res.set("Cache-Control", "public, max-age=60");
  res.json({ gifts: await listGiftCatalogue() });
}
