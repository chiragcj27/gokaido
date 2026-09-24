import { mongoose } from "../client.js";

// A physical Gokaido store shown in the homepage "Visit Our Store" section.
// One document per store; `city` is the label on the selector below the
// photo, so two stores in the same city (e.g. two in Goa) are fine.
export interface IStore {
  city: string;
  name: string;
  address: string;
  hours?: string;
  phone?: string;
  image?: string;
  // Explicit Google Maps link. When absent the storefront falls back to a
  // maps search on `address`.
  directionsUrl?: string;
  // Ascending — controls the order of the city selector.
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new mongoose.Schema<IStore>(
  {
    city: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    hours: { type: String, trim: true },
    phone: { type: String, trim: true },
    image: { type: String, trim: true },
    directionsUrl: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ isActive: 1, sortOrder: 1, createdAt: 1 });

export const Store = mongoose.models.Store ?? mongoose.model<IStore>("Store", storeSchema);
