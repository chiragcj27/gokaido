import { mongoose } from "../client.js";

export interface IHomepageFaq {
  question: string;
  answer: string;
}

// Singleton — one document holds all homepage CMS content (hero for now,
// more sections later e.g. featured categories). Always read/written via
// getSingleton() below rather than find(), so callers can't accidentally
// create a second document.
export interface IHomepageSettings {
  heroVideoUrl?: string;
  heroVideoPosterUrl?: string;
  // Phones only: vertical (9:16) cut the hero reel crossfades into as it
  // grows full-screen. Unset → phones cover-crop heroVideoUrl instead.
  heroMobileVideoUrl?: string;
  heroBackgroundImageUrl?: string;
  // Phones only: portrait cut of the hero background.
  heroMobileBackgroundImageUrl?: string;
  // The product tiles in the white card between "MADE" and "TO" — one image
  // per tile (square product shots), laid out side by side by the storefront.
  heroShowcaseImages?: string[];
  // Search modal chips + the typewriter placeholder words.
  trendingSearches?: string[];
  // Store-wide FAQs shown on every PDP, /best-sellers and /search.
  faqs?: IHomepageFaq[];
  playStoreUrl?: string;
  appStoreUrl?: string;
  // "Beyond the Medal" CTA target — a form page, WhatsApp link or mailto:.
  beyondTheMedalUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const homepageSettingsSchema = new mongoose.Schema<IHomepageSettings>(
  {
    heroVideoUrl: { type: String, trim: true },
    heroVideoPosterUrl: { type: String, trim: true },
    heroMobileVideoUrl: { type: String, trim: true },
    heroBackgroundImageUrl: { type: String, trim: true },
    heroMobileBackgroundImageUrl: { type: String, trim: true },
    heroShowcaseImages: { type: [String], default: undefined },
    trendingSearches: { type: [String], default: undefined },
    faqs: {
      type: [
        new mongoose.Schema<IHomepageFaq>(
          { question: { type: String, trim: true }, answer: { type: String, trim: true } },
          { _id: false }
        ),
      ],
      default: undefined,
    },
    playStoreUrl: { type: String, trim: true },
    appStoreUrl: { type: String, trim: true },
    beyondTheMedalUrl: { type: String, trim: true },
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
  update: Partial<Omit<IHomepageSettings, "createdAt" | "updatedAt">>
) {
  return HomepageSettings.findByIdAndUpdate(
    SINGLETON_ID,
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean<LeanHomepageSettings | null>();
}
