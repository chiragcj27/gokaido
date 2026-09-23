import type { Request, Response } from "express";
import {
  HomepageSettings,
  getHomepageSettingsSingleton,
  upsertHomepageSettingsSingleton,
} from "@gokaido/database";
import { updateHomepageSettingsSchema } from "../schemas/homepageSettings.schema.js";

// Public — the storefront homepage fetches this unauthenticated, same as the
// Google Shopping feed. Cheap single-document read; no reason to gate it.
export async function getHomepageSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getHomepageSettingsSingleton();
  res.json({
    settings: {
      heroVideoUrl: settings?.heroVideoUrl ?? null,
      heroVideoPosterUrl: settings?.heroVideoPosterUrl ?? null,
      heroBackgroundImageUrl: settings?.heroBackgroundImageUrl ?? null,
      heroShowcaseImages: settings?.heroShowcaseImages ?? [],
    },
  });
}

export async function updateHomepageSettings(req: Request, res: Response): Promise<void> {
  const parsed = updateHomepageSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid homepage settings" });
    return;
  }

  // "" (single fields) and [] (image lists) both mean "clear this" from the
  // admin form — turn them into a real unset rather than storing an empty
  // value the web app would have to treat as falsy anyway.
  const set: Record<string, string | string[]> = {};
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (value === "" || (Array.isArray(value) && value.length === 0)) unset[key] = "";
    else set[key] = value;
  }

  const settings = await upsertHomepageSettingsSingleton(set);
  if (Object.keys(unset).length > 0) {
    await HomepageSettings.updateOne({ _id: settings!._id }, { $unset: unset });
  }

  res.json({ settings: await getHomepageSettingsSingleton() });
}
