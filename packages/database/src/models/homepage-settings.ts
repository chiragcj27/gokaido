import { mongoose } from "../client.js";

// Singleton — one document holds all homepage CMS content (hero for now,
// more sections later e.g. featured categories). Always read/written via
// getSingleton() below rather than find(), so callers can't accidentally
// create a second document.
export interface IHomepageSettings {
  heroVideoUrl?: string;
  heroVideoPosterUrl?: string;
  heroBackgroundImageUrl?: string;
  // The product tiles in the white card between "MADE" and "TO" — one image
  // per tile (square product shots), laid out side by side by the storefront.
  // Design supplies them as separate photos rather than one composited card,
  // so unlike Product.cardImage these are NOT pre-composited.
  heroShowcaseImages?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const homepageSettingsSchema = new mongoose.Schema<IHomepageSettings>(
  {
    heroVideoUrl: { type: String, trim: true },
    heroVideoPosterUrl: { type: String, trim: true },
    heroBackgroundImageUrl: { type: String, trim: true },
    heroShowcaseImages: { type: [String], default: undefined },
  },
  { timestamps: true }
);

export const HomepageSettings =
  mongoose.models.HomepageSettings ??
  mongoose.model<IHomepageSettings>("HomepageSettings", homepageSettingsSchema);

// Fixed id so there's ever only one document — upsert against it instead of
// findOne()+create() to avoid a race creating two on first-ever write.
const SINGLETON_ID = new mongoose.Types.ObjectId("000000000000000000000001");

type LeanHomepageSettings = IHomepageSettings & { _id: mongoose.Types.ObjectId };

export async function getHomepageSettingsSingleton() {
  return HomepageSettings.findById(SINGLETON_ID).lean<LeanHomepageSettings | null>();
}

export async function upsertHomepageSettingsSingleton(
  update: Partial<
    Pick<IHomepageSettings, "heroVideoUrl" | "heroVideoPosterUrl" | "heroBackgroundImageUrl" | "heroShowcaseImages">
  >
) {
  return HomepageSettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<LeanHomepageSettings | null>();
}
