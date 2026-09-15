import { mongoose } from "../client.js";

// A reusable media library entry — upload once, get back a name-tagged S3
// URL that can be pasted into other flows (e.g. the image columns of a
// product bulk-upload spreadsheet) without re-uploading the same file.
export interface IAsset {
  name: string;
  url: string;
  key: string;
  contentType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new mongoose.Schema<IAsset>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    key: { type: String, required: true },
    contentType: String,
  },
  { timestamps: true }
);

assetSchema.index({ name: "text" });

export const Asset = mongoose.models.Asset ?? mongoose.model<IAsset>("Asset", assetSchema);
