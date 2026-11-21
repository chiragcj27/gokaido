import type { Request, Response } from "express";
import { Event, mongoose } from "@gokaido/database";
import { createEventSchema, updateEventSchema } from "../schemas/event.schema.js";

const OPTIONAL_FIELDS = ["category", "dates", "recognition", "hostedBy"] as const;

// Public — the storefront /events page reads this unauthenticated. Only active events,
// only the fields the page renders.
export async function listPublicEvents(_req: Request, res: Response): Promise<void> {
  const events = await Event.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .select("name year category about dates place sport recognition hostedBy images")
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

  const event = await Event.create(data);
  res.status(201).json({ event });
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
    if (value === "" && (OPTIONAL_FIELDS as readonly string[]).includes(key)) unset[key] = "";
    else set[key] = value;
  }

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
