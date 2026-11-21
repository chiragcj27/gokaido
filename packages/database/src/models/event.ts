import { mongoose } from "../client.js";

// An event Gokaido sponsored or took part in, shown on the storefront /events
// scroller. Every field maps 1:1 to something the page renders; `dates` is
// free text ("5–10 October 2026") because it's display-only and nothing
// sorts or filters on it — order is `sortOrder`.
export interface IEvent {
  name: string;
  /** URL segment for /events/{slug}; generated from name + year when not given. */
  slug: string;
  /** Small label over the name, e.g. "2026". */
  year: string;
  /** Kind of event, e.g. "World Championship". */
  category?: string;
  about: string;
  dates?: string;
  /** "Event place" — venue / city. */
  place: string;
  sport: string;
  /** Gokaido's role or the event's recognition, e.g. "Official sponsor". */
  recognition?: string;
  hostedBy?: string;
  /** Optional external link (federation site, results, social post) — "Visit event site" on the detail page. */
  link?: string;
  /** First is the cover; the next two fan out behind it on /events; all of them make the detail-page gallery. */
  images: string[];
  // Ascending — first is "01" on the page.
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema<IEvent>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    year: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    about: { type: String, required: true, trim: true },
    dates: { type: String, trim: true },
    place: { type: String, required: true, trim: true },
    sport: { type: String, required: true, trim: true },
    recognition: { type: String, trim: true },
    hostedBy: { type: String, trim: true },
    link: { type: String, trim: true },
    images: { type: [String], default: [] },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 });

export const Event = mongoose.models.Event ?? mongoose.model<IEvent>("Event", eventSchema);
