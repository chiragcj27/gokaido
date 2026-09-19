import { z } from "zod";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_TYPES = ["video/mp4", "video/webm"] as const;

// Which upload purposes exist, who is allowed to use them, and which content
// types are accepted for each — kept together so adding a purpose can't miss
// a rule on the other axis.
export const UPLOAD_PURPOSES = {
  product: { folder: "products", roles: ["admin", "superadmin"], contentTypes: IMAGE_TYPES },
  category: { folder: "categories", roles: ["admin", "superadmin"], contentTypes: IMAGE_TYPES },
  sizeGuide: { folder: "size-guides", roles: ["admin", "superadmin"], contentTypes: IMAGE_TYPES },
  blog: { folder: "blog", roles: ["admin", "superadmin"], contentTypes: IMAGE_TYPES },
  banner: { folder: "banners", roles: ["admin", "superadmin"], contentTypes: IMAGE_TYPES },
  asset: { folder: "assets", roles: ["admin", "superadmin"], contentTypes: IMAGE_TYPES },
  review: { folder: "reviews", roles: null, contentTypes: [...IMAGE_TYPES, ...VIDEO_TYPES] },
} as const;

export type UploadPurpose = keyof typeof UPLOAD_PURPOSES;

export const presignUploadSchema = z.object({
  purpose: z.enum(Object.keys(UPLOAD_PURPOSES) as [UploadPurpose, ...UploadPurpose[]]),
  fileName: z.string().trim().min(1).max(255),
  contentType: z.string().trim().min(1).max(100),
});
