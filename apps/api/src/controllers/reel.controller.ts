import type { Request, Response } from "express";
import { Reel, mongoose } from "@gokaido/database";
import { createReelSchema, updateReelSchema } from "../schemas/reel.schema.js";

const OPTIONAL_FIELDS = ["videoUrl", "posterUrl", "instagramUrl", "product"] as const;

type PublicReelDoc = {
  _id: unknown;
  videoUrl?: string;
  posterUrl?: string;
  instagramUrl?: string;
  product?: PopulatedProduct | null;
};

type PopulatedProduct = {
  name: string;
  slug: string;
  cardImage?: string;
  images?: string[];
  isActive: boolean;
  variants: Array<{ basePrice: number; isActive: boolean }>;
};

// Public — storefront homepage reads this unauthenticated. Only active reels,
// only what the carousel renders. The attached product is flattened to the
// small card's fields; an inactive or deleted product just drops the card
// rather than hiding the reel.
export async function listPublicReels(_req: Request, res: Response): Promise<void> {
  const reels = await Reel.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("videoUrl posterUrl instagramUrl product")
    .populate({ path: "product", select: "name slug cardImage images isActive variants.basePrice variants.isActive" })
    .lean<PublicReelDoc[]>();

  res.json({
    reels: reels.map((r) => {
      const p = r.product;
      const prices = p?.variants.filter((v) => v.isActive).map((v) => v.basePrice) ?? [];
      const showProduct = p && p.isActive && prices.length > 0;
      return {
        _id: r._id,
        videoUrl: r.videoUrl,
        posterUrl: r.posterUrl,
        instagramUrl: r.instagramUrl,
        product: showProduct
          ? { name: p.name, slug: p.slug, image: p.cardImage ?? p.images?.[0], price: Math.min(...prices) }
          : null,
      };
    }),
  });
}

export async function listReels(_req: Request, res: Response): Promise<void> {
  const reels = await Reel.find().sort({ sortOrder: 1, createdAt: 1 });
  res.json({ reels });
}

export async function createReel(req: Request, res: Response): Promise<void> {
  const parsed = createReelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid reel" });
    return;
  }

  const data: Record<string, unknown> = { ...parsed.data };
  for (const key of OPTIONAL_FIELDS) if (data[key] === "") delete data[key];

  const reel = await Reel.create(data);
  res.status(201).json({ reel });
}

export async function updateReel(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid reel id" });
    return;
  }

  const parsed = updateReelSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid reel" });
    return;
  }

  const set: Record<string, unknown> = {};
  const unset: Record<string, ""> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value === undefined) continue;
    if (value === "" && (OPTIONAL_FIELDS as readonly string[]).includes(key)) unset[key] = "";
    else set[key] = value;
  }

  const existing = await Reel.findById(req.params.id).select("videoUrl instagramUrl");
  if (!existing) {
    res.status(404).json({ error: "Reel not found" });
    return;
  }
  const finalVideo = "videoUrl" in unset ? undefined : (set.videoUrl ?? existing.videoUrl);
  const finalInstagram = "instagramUrl" in unset ? undefined : (set.instagramUrl ?? existing.instagramUrl);
  if (!finalVideo && !finalInstagram) {
    res.status(400).json({ error: "A reel needs a video, an Instagram link, or both" });
    return;
  }

  const reel = await Reel.findByIdAndUpdate(
    req.params.id,
    { ...(Object.keys(set).length > 0 && { $set: set }), ...(Object.keys(unset).length > 0 && { $unset: unset }) },
    { new: true }
  );
  if (!reel) {
    res.status(404).json({ error: "Reel not found" });
    return;
  }

  res.json({ reel });
}

export async function deleteReel(req: Request, res: Response): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400).json({ error: "Invalid reel id" });
    return;
  }

  const reel = await Reel.findByIdAndDelete(req.params.id);
  if (!reel) {
    res.status(404).json({ error: "Reel not found" });
    return;
  }

  res.json({ ok: true });
}
