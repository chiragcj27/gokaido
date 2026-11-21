import type { Request, Response } from "express";
import { Event, mongoose } from "@gokaido/database";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema.js";
import { slugify } from "../utils/slug.js";

const OPTIONAL_FIELDS = ["category", "dates", "recognition", "hostedBy", "link"] as const;

const isDuplicateKey = (err: unknown) => (err as { code?: number })?.code === 11000;

// "{name}-{year}" (year skipped when the name already has it), suffixed -2, -3… until free —
// recurring events ("State Championship" every year) would otherwise collide.
async function uniqueSlug(name: string, year: string): Promise<string> {
  const base = slugify(name.includes(year) ? name : `${name} ${year}`).slice(0, 110) || "event";
  let slug = base;
  for (let n = 2; await Event.exists({ slug }); n++) slug = `${base}-${n}`;
  return slug;
}

// Public — the storefront /events page and /events/{slug} read this unauthenticated (one cached
// list serves both). Only active events, only the fields the pages render.
export async function listPublicEvents(_req: Request, res: Response): Promise<void> {
  const events = await Event.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .select("name slug year category about dates place sport recognition hostedBy link images")
    .lean();
  res.json({ events });
}

export async function listEvents(_req: Request, res: Response): Promise<void> {
  const events = await Event.find().sort({ sortOrder: 1, createdAt: -1 });
  res.json({ events });
}

export async function createEvent(req: Request, res: Response): Promise<void> {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid event" });
    return;
  }

  // Drop empty optionals rather than storing "" the storefront would have to
  // treat as falsy anyway.
  const data: Record<string, unknown> = { ...parsed.data };
  for (const key of OPTIONAL_FIELDS) if (data[key] === "") delete data[key];
  if (!data.slug) data.slug = await uniqueSlug(parsed.data.name, parsed.data.year);

  try {
    const event = await Event.create(data);
    res.status(201).json({ event });
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: "Another event already uses this URL slug" });
      return;
    }
    throw err;
  }
}

export async function updateEvent(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid event" });
    return;
  }

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    // A cleared slug keeps the current one — URLs stay stable when the name is edited.
    if (key === "slug" && value === "") continue;
    if (value === "" && (OPTIONAL_FIELDS as readonly string[]).includes(key)) unset[key] = "";
    else set[key] = value;
  }

  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { ...(Object.keys(set).length > 0 && { $set: set }), ...(Object.keys(unset).length > 0 && { $unset: unset }) },
      { new: true }
    );
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ event });
  } catch (err) {
    if (isDuplicateKey(err)) {
      res.status(409).json({ error: "Another event already uses this URL slug" });
      return;
    }
    throw err;
  }
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid event id" });
    return;
  }

  const event = await Event.findByIdAndDelete(req.params.id);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }

  res.json({ ok: true });
}
