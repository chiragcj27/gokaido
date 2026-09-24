import type { Request, Response } from "express";
import { Store, mongoose } from "@gokaido/database";
import { createStoreSchema, updateStoreSchema } from "../schemas/store.schema.js";

const OPTIONAL_FIELDS = ["hours", "phone", "image", "directionsUrl"] as const;

// Public — storefront homepage reads this unauthenticated. Only active stores,
// only the fields the section renders.
export async function listPublicStores(_req: Request, res: Response): Promise<void> {
  const stores = await Store.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("city name address hours phone image directionsUrl")
    .lean();
  res.json({ stores });
}

export async function listStores(_req: Request, res: Response): Promise<void> {
  const stores = await Store.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ stores });
}

export async function createStore(req: Request, res: Response): Promise<void> {
  const parsed = createStoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid store" });
    return;
  }

  // Drop empty optionals rather than storing "" the storefront would have to
  // treat as falsy anyway.
  const data: Record<string, unknown> = { ...parsed.data };
  for (const key of OPTIONAL_FIELDS) if (data[key] === "") delete data[key];

  const store = await Store.create(data);
  res.status(201).json({ store });
}

export async function updateStore(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid store id" });
    return;
  }

  const parsed = updateStoreSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid store" });
    return;
  }

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (value === "" && (OPTIONAL_FIELDS as readonly string[]).includes(key)) unset[key] = "";
    else set[key] = value;
  }

  const store = await Store.findByIdAndUpdate(
    req.params.id,
    { ...(Object.keys(set).length > 0 && { $set: set }), ...(Object.keys(unset).length > 0 && { $unset: unset }) },
    { new: true }
  );
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json({ store });
}

export async function deleteStore(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid store id" });
    return;
  }

  const store = await Store.findByIdAndDelete(req.params.id);
  if (!store) {
    res.status(404).json({ error: "Store not found" });
    return;
  }

  res.json({ ok: true });
}
