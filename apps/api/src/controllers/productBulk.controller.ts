import type { Request, Response } from "express";
import ExcelJS from "exceljs";
import { Category, Subcategory, Color, Product } from "@gokaido/database";
import { createProductSchema } from "../schemas/product.schema.js";
import {
  bulkProductRowSchema,
  splitCsv,
  BULK_TEMPLATE_HEADERS,
  BULK_TEMPLATE_EXAMPLE_ROWS,
  type BulkProductRow,
} from "../schemas/productBulk.schema.js";

type RowError = { row: number; message: string };
type GroupError = { slug: string; rows: number[]; message: string };

function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(row)) {
    if (raw === null || raw === undefined || raw === "") continue;
    // exceljs hands back rich-text objects for some cell types — flatten to plain text.
    const value =
      typeof raw === "object" && raw !== null && "text" in (raw as Record<string, unknown>)
        ? (raw as { text: unknown }).text
        : raw;
    out[key] = typeof value === "string" ? value.trim() : String(value).trim();
  }
  return out;
}

async function parseWorkbook(
  buffer: Buffer
): Promise<{ rowNumber: number; data: Record<string, unknown> }[]> {
  const workbook = new ExcelJS.Workbook();
  // multer's Buffer and exceljs's declared Buffer type disagree structurally
  // under this repo's TS config even though they're the same type at runtime.
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const headers: string[] = [];
  worksheet.getRow(1).eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: { rowNumber: number; data: Record<string, unknown> }[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const data: Record<string, unknown> = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (!header) return;
      if (cell.value !== null && cell.value !== undefined && cell.value !== "") hasValue = true;
      data[header] = cell.value;
    });
    if (hasValue) rows.push({ rowNumber, data });
  });

  return rows;
}

export async function bulkUploadProducts(req: Request, res: Response): Promise<void> {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded — attach an .xlsx file as `file`" });
    return;
  }

  let rawRows: { rowNumber: number; data: Record<string, unknown> }[];
  try {
    rawRows = await parseWorkbook(req.file.buffer);
  } catch {
    res.status(400).json({ error: "Could not read the uploaded file — is it a valid .xlsx?" });
    return;
  }

  if (rawRows.length === 0) {
    res.status(400).json({ error: "Sheet has no data rows" });
    return;
  }

  const [categories, subcategories, colors] = await Promise.all([
    Category.find({ isActive: true }).lean(),
    Subcategory.find({ isActive: true }).lean(),
    Color.find({ isActive: true }).lean(),
  ]);
  const categoryByName = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));
  const subcategoryByKey = new Map(
    subcategories.map((s) => [`${s.category}:${s.name.trim().toLowerCase()}`, s])
  );
  const colorByName = new Map(colors.map((c) => [c.name.trim().toLowerCase(), c]));

  const rowErrors: RowError[] = [];
  const groups = new Map<
    string,
    { rows: number[]; data: BulkProductRow; category: string; subcategory?: string }[]
  >();

  for (const { rowNumber, data } of rawRows) {
    const parsed = bulkProductRowSchema.safeParse(normalizeRow(data));
    if (!parsed.success) {
      rowErrors.push({ row: rowNumber, message: parsed.error.issues[0]?.message ?? "Invalid row" });
      continue;
    }

    const row = parsed.data;
    const category = categoryByName.get(row.category.toLowerCase());
    if (!category) {
      rowErrors.push({
        row: rowNumber,
        message: `Category "${row.category}" not found — create it in Categories first`,
      });
      continue;
    }

    let subcategorySlug: string | undefined;
    if (row.subcategory) {
      const subcategory = subcategoryByKey.get(`${category._id}:${row.subcategory.toLowerCase()}`);
      if (!subcategory) {
        rowErrors.push({
          row: rowNumber,
          message: `Subcategory "${row.subcategory}" not found under category "${category.name}"`,
        });
        continue;
      }
      subcategorySlug = subcategory.slug;
    }

    const color = colorByName.get(row.color.trim().toLowerCase());
    if (!color) {
      rowErrors.push({
        row: rowNumber,
        message: `Colour "${row.color}" not found — create it in Colors first`,
      });
      continue;
    }

    // Normalize to the master list's exact spelling/casing so every row of
    // this colour — however it was typed in the sheet — ends up with the
    // same stored value.
    const normalizedRow: BulkProductRow = { ...row, color: color.name };

    const bucket = groups.get(row.slug) ?? [];
    bucket.push({
      rows: [rowNumber],
      data: normalizedRow,
      category: category.slug,
      subcategory: subcategorySlug,
    });
    groups.set(row.slug, bucket);
  }

  const created: string[] = [];
  const skipped: { slug: string; reason: string }[] = [];
  const groupErrors: GroupError[] = [];

  for (const [slug, entries] of groups) {
    const rowNumbers = entries.flatMap((e) => e.rows);
    const first = entries[0]!.data;
    const name = entries.find((e) => e.data.name)?.data.name;
    if (!name) {
      groupErrors.push({ slug, rows: rowNumbers, message: "Missing `name` for this product" });
      continue;
    }

    const skus = new Set<string>();
    let duplicateSku: string | null = null;
    for (const e of entries) {
      if (skus.has(e.data.sku)) duplicateSku = e.data.sku;
      skus.add(e.data.sku);
    }
    if (duplicateSku) {
      groupErrors.push({
        slug,
        rows: rowNumbers,
        message: `Duplicate SKU "${duplicateSku}" within this product's rows`,
      });
      continue;
    }

    if (await Product.exists({ slug })) {
      skipped.push({ slug, reason: "A product with this slug already exists — edit it individually" });
      continue;
    }

    // Photos are per colour, not per size — a colour's sizes all share the
    // same shoot, so `variantImages` only needs to be filled in on that
    // colour's first row; later size rows for the same colour inherit it.
    const imagesByColor = new Map<string, string[]>();
    for (const e of entries) {
      const key = e.data.color.trim().toLowerCase();
      const imgs = splitCsv(e.data.variantImages);
      if (imgs.length > 0 && !imagesByColor.has(key)) imagesByColor.set(key, imgs);
    }

    const payload = {
      name,
      slug,
      sport: first.sport,
      category: entries[0]!.category,
      subcategory: entries[0]!.subcategory,
      productType: first.productType,
      description: first.description,
      images: splitCsv(first.images),
      cardImage: first.cardImage,
      competitorImage: first.competitorImage,
      tags: splitCsv(first.tags),
      isFeatured: first.isFeatured,
      isNewArrival: first.isNewArrival,
      isBestseller: first.isBestseller,
      variants: entries.map((e) => ({
        sku: e.data.sku,
        color: e.data.color,
        size: e.data.size,
        stock: e.data.stock,
        basePrice: e.data.basePrice,
        images: imagesByColor.get(e.data.color.trim().toLowerCase()) ?? [],
      })),
    };

    const validated = createProductSchema.safeParse(payload);
    if (!validated.success) {
      groupErrors.push({
        slug,
        rows: rowNumbers,
        message: validated.error.issues[0]?.message ?? "Invalid product data",
      });
      continue;
    }

    await Product.create(validated.data);
    created.push(slug);
  }

  res.json({
    created,
    skipped,
    errors: [
      ...rowErrors,
      ...groupErrors.map((e) => ({ row: e.rows[0], message: `[${e.slug}] ${e.message}` })),
    ],
  });
}

export async function downloadBulkTemplate(_req: Request, res: Response): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");
  sheet.addRow(BULK_TEMPLATE_HEADERS as unknown as string[]);
  for (const row of BULK_TEMPLATE_EXAMPLE_ROWS) sheet.addRow(row);
  sheet.getRow(1).font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=product-bulk-upload-template.xlsx");
  await workbook.xlsx.write(res);
  res.end();
}
