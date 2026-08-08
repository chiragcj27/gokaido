import { mongoose } from "../client.js";

export interface IBlogPost {
  // Multilingual content — keyed by language code (en, hi, mr, ta)
  title: Map<string, string>;
  slug: string;
  content: Map<string, string>;
  excerpt?: Map<string, string>;
  metaTitle?: Map<string, string>;
  metaDescription?: Map<string, string>;

  featuredImage?: string;
  author: string;

  tags: string[];
  sport?: string;

  isPublished: boolean;
  publishedAt?: Date;

  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const blogPostSchema = new mongoose.Schema<IBlogPost>(
  {
    title: { type: Map, of: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    content: { type: Map, of: String, required: true },
    excerpt: { type: Map, of: String },
    metaTitle: { type: Map, of: String },
    metaDescription: { type: Map, of: String },

    featuredImage: String,
    author: { type: String, required: true },

    tags: [{ type: String }],
    sport: String,

    isPublished: { type: Boolean, default: false },
    publishedAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ tags: 1 });

export const BlogPost =
  mongoose.models.BlogPost ??
  mongoose.model<IBlogPost>("BlogPost", blogPostSchema);
