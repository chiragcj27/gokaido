import type { Request, Response } from "express";
import { Category, Subcategory, mongoose } from "@gokaido/database";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryListQuerySchema,
} from "../schemas/category.schema.js";

function isAdmin(req: Request): boolean {
  return req.user?.role === "admin" || req.user?.role === "superadmin";
}

function buildStatusFilter(status: "active" | "inactive" | "all" | undefined, canSeeInactive: boolean) {
  const effective = canSeeInactive ? (status ?? "active") : "active";
  if (effective === "active") return { isActive: true };
  if (effective === "inactive") return { isActive: false };
  return {};
}

export async function listCategories(req: Request, res: Response): Promise<void> {
  const parsed = categoryListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const filter = buildStatusFilter(parsed.data.status, isAdmin(req));
  const categories = await Category.find(filter).sort({ name: 1 });

  res.json({ categories });
}

export async function getCategory(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json({ category });
}

export async function createCategory(req: Request, res: Response): Promise<void> {
  const parsed = createCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid category data" });
    return;
  }

  if (await Category.exists({ slug: parsed.data.slug })) {
    res.status(409).json({ error: "A category with this slug already exists" });
    return;
  }

  const category = await Category.create(parsed.data);
  res.status(201).json({ category });
}

export async function updateCategory(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const parsed = updateCategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid category data" });
    return;
  }

  if (
    parsed.data.slug &&
    (await Category.exists({ slug: parsed.data.slug, _id: { $ne: req.params.id } }))
  ) {
    res.status(409).json({ error: "A category with this slug already exists" });
    return;
  }

  const category = await Category.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json({ category });
}

export async function deleteCategory(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid category id" });
    return;
  }

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  await Subcategory.updateMany({ category: category._id }, { isActive: false });

  res.json({ category });
}
