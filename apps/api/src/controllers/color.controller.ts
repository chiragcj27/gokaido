import type { Request, Response } from "express";
import { Color, mongoose } from "@gokaido/database";
import { createColorSchema, updateColorSchema, colorListQuerySchema } from "../schemas/color.schema.js";

function isAdmin(req: Request): boolean {
  return req.user?.role === "admin" || req.user?.role === "superadmin";
}

function buildStatusFilter(status: "active" | "inactive" | "all" | undefined, canSeeInactive: boolean) {
  const effective = canSeeInactive ? (status ?? "active") : "active";
  if (effective === "active") return { isActive: true };
  if (effective === "inactive") return { isActive: false };
  return {};
}

export async function listColors(req: Request, res: Response): Promise<void> {
  const parsed = colorListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const filter = buildStatusFilter(parsed.data.status, isAdmin(req));
  const colors = await Color.find(filter).sort({ name: 1 });

  res.json({ colors });
}

export async function getColor(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid color id" });
    return;
  }

  const color = await Color.findById(req.params.id);
  if (!color) {
    res.status(404).json({ error: "Color not found" });
    return;
  }

  res.json({ color });
}

export async function createColor(req: Request, res: Response): Promise<void> {
  const parsed = createColorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid color data" });
    return;
  }

  if (await Color.exists({ slug: parsed.data.slug })) {
    res.status(409).json({ error: "A color with this slug already exists" });
    return;
  }

  const color = await Color.create(parsed.data);
  res.status(201).json({ color });
}

export async function updateColor(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid color id" });
    return;
  }

  const parsed = updateColorSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid color data" });
    return;
  }

  if (parsed.data.slug && (await Color.exists({ slug: parsed.data.slug, _id: { $ne: req.params.id } }))) {
    res.status(409).json({ error: "A color with this slug already exists" });
    return;
  }

  const color = await Color.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!color) {
    res.status(404).json({ error: "Color not found" });
    return;
  }

  res.json({ color });
}

export async function deleteColor(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid color id" });
    return;
  }

  const color = await Color.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!color) {
    res.status(404).json({ error: "Color not found" });
    return;
  }

  res.json({ color });
}
