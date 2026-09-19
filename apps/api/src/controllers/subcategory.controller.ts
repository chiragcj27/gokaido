import type { Request, Response } from "express";
import { Category, Subcategory, mongoose } from "@gokaido/database";
import {
  createSubcategorySchema,
  updateSubcategorySchema,
  subcategoryListQuerySchema,
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

export async function listSubcategories(req: Request, res: Response): Promise<void> {
  const parsed = subcategoryListQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query" });
    return;
  }

  const filter: Record<string, unknown> = buildStatusFilter(parsed.data.status, isAdmin(req));
  if (parsed.data.category) filter.category = parsed.data.category;

  const subcategories = await Subcategory.find(filter).populate("category", "name slug").sort({ name: 1 });

  res.json({ subcategories });
}

export async function getSubcategory(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid subcategory id" });
    return;
  }

  const subcategory = await Subcategory.findById(req.params.id).populate("category", "name slug");
  if (!subcategory) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  res.json({ subcategory });
}

export async function createSubcategory(req: Request, res: Response): Promise<void> {
  const parsed = createSubcategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid subcategory data" });
    return;
  }

  if (!(await Category.exists({ _id: parsed.data.category }))) {
    res.status(400).json({ error: "Category not found" });
    return;
  }

  if (await Subcategory.exists({ category: parsed.data.category, slug: parsed.data.slug })) {
    res.status(409).json({ error: "A subcategory with this slug already exists under this category" });
    return;
  }

  // sizeGuide: null only means something on update (clears an existing
  // guide) — on create there's nothing to clear, so drop it either way.
  const { sizeGuide, ...data } = parsed.data;
  const subcategory = await Subcategory.create(sizeGuide ? { ...data, sizeGuide } : data);
  res.status(201).json({ subcategory });
}

export async function updateSubcategory(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid subcategory id" });
    return;
  }

  const parsed = updateSubcategorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid subcategory data" });
    return;
  }

  if (parsed.data.category && !(await Category.exists({ _id: parsed.data.category }))) {
    res.status(400).json({ error: "Category not found" });
    return;
  }

  if (parsed.data.slug) {
    const existing = await Subcategory.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Subcategory not found" });
      return;
    }
    const category = parsed.data.category ?? String(existing.category);
    if (
      await Subcategory.exists({
        category,
        slug: parsed.data.slug,
        _id: { $ne: req.params.id },
      })
    ) {
      res.status(409).json({ error: "A subcategory with this slug already exists under this category" });
      return;
    }
  }

  // sizeGuide: null means "clear it" — a plain $set would leave the old
  // subdocument in place since Mongo treats a null value as data, not
  // absence, so that case needs its own $unset.
  const { sizeGuide, ...rest } = parsed.data;
  const updateOp =
    sizeGuide === null
      ? { $set: rest, $unset: { sizeGuide: "" } }
      : { $set: sizeGuide !== undefined ? { ...rest, sizeGuide } : rest };

  const subcategory = await Subcategory.findByIdAndUpdate(req.params.id, updateOp, { new: true });
  if (!subcategory) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  res.json({ subcategory });
}

export async function deleteSubcategory(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid subcategory id" });
    return;
  }

  const subcategory = await Subcategory.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!subcategory) {
    res.status(404).json({ error: "Subcategory not found" });
    return;
  }

  res.json({ subcategory });
}
