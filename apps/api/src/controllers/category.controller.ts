import type { Request, Response } from "express";
import { Category, Product, Subcategory, mongoose } from "@gokaido/database";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryListQuerySchema,
  reorderSchema,
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
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 });

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

  // New categories go to the end unless a position was given.
  const last = await Category.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean<{ sortOrder?: number }>();
  const sortOrder = parsed.data.sortOrder ?? (last?.sortOrder ?? 0) + 1;

  const category = await Category.create({ ...parsed.data, sortOrder });
  res.status(201).json({ category });
}

export async function reorderCategories(req: Request, res: Response): Promise<void> {
  const parsed = reorderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid order" });
    return;
  }

  await Category.bulkWrite(
    parsed.data.ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index + 1 } } },
    }))
  );

  res.json({ ok: true });
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

  // Plain DELETE only deactivates (reversible); ?permanent=true removes the
  // category and its subcategories for good.
  if (req.query.permanent === "true") {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ error: "Category not found" });
      return;
    }

    // Products reference categories by slug, not id, so nothing would stop a
    // delete from orphaning them — refuse instead.
    const productCount = await Product.countDocuments({ category: category.slug });
    if (productCount > 0) {
      res.status(409).json({
        error: `${productCount} product(s) still use this category. Move or delete them first.`,
      });
      return;
    }

    await Subcategory.deleteMany({ category: category._id });
    await category.deleteOne();
    res.json({ deleted: true });
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
