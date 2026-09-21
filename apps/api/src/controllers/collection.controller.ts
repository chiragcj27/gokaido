import type { Request, Response } from "express";
import { Category, Subcategory, Color, Product } from "@gokaido/database";

// Products shown per subcategory section; `total` tells the storefront whether to link to "view all".
const PRODUCTS_PER_SUBCATEGORY = 24;
const FALLBACK_HEX = "#888888";

type AggProduct = {
  name: string;
  slug: string;
  cardImage: string;
  variants: { color: string; basePrice: number }[];
};
type CategoryDoc = { _id: unknown; name: string; slug: string; description?: string; image?: string };
type SubcategoryDoc = { name: string; slug: string; description?: string; image?: string; icon?: string };
type ColorDoc = { name: string; slug: string; hex: string };
type AggGroup = { _id: string | null; total: number; products: AggProduct[] };

/**
 * One request for the whole collection page: the category, its subcategories, and a capped list of
 * card-ready products per subcategory. Replaces what would otherwise be 1 + N list calls from the
 * storefront. Only the fields a card renders are projected, so the payload stays small.
 */
export async function getCollection(req: Request, res: Response): Promise<void> {
  const slug = String(req.params.category).toLowerCase();

  const category = (await Category.findOne({ slug, isActive: true })
    .select("name slug description image icon")
    .lean()) as CategoryDoc | null;
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [subcategories, colors, groups] = (await Promise.all([
    Subcategory.find({ category: category._id, isActive: true })
      .select("name slug description image")
      .sort({ name: 1 })
      .lean(),
    Color.find({ isActive: true }).select("name slug hex").lean(),
    Product.aggregate<AggGroup>([
      // Cards only render the finished card visual (see CLAUDE.md "Product Image Fields").
      { $match: { isActive: true, category: slug, cardImage: { $exists: true, $ne: "" } } },
      { $sort: { isBestseller: -1, isFeatured: -1, createdAt: -1 } },
      {
        $project: {
          name: 1,
          slug: 1,
          cardImage: 1,
          subcategory: 1,
          variants: {
            $map: {
              input: { $filter: { input: "$variants", cond: "$$this.isActive" } },
              as: "v",
              in: { color: "$$v.color", basePrice: "$$v.basePrice" },
            },
          },
        },
      },
      { $match: { "variants.0": { $exists: true } } },
      { $group: { _id: "$subcategory", total: { $sum: 1 }, products: { $push: "$$ROOT" } } },
      { $project: { total: 1, products: { $slice: ["$products", PRODUCTS_PER_SUBCATEGORY] } } },
    ]),
  ])) as unknown as [SubcategoryDoc[], ColorDoc[], AggGroup[]];

  const colorByName = new Map(colors.map((c) => [c.name.trim().toLowerCase(), c]));
  const groupBySub = new Map(groups.map((g) => [g._id, g]));

  const sections = subcategories.flatMap((sub) => {
    const group = groupBySub.get(sub.slug);
    if (!group) return []; // Empty subcategories don't get a section.

    return [
      {
        slug: sub.slug,
        name: sub.name,
        description: sub.description ?? null,
        icon: sub.icon ?? null,
        image: sub.image ?? group.products[0]?.cardImage ?? null,
        total: group.total,
        products: group.products.map((p) => {
          const seen = new Map<string, { name: string; hex: string }>();
          for (const v of p.variants) {
            const known = colorByName.get(v.color.trim().toLowerCase());
            const key = known?.slug ?? v.color.trim().toLowerCase();
            if (!seen.has(key)) seen.set(key, { name: v.color, hex: known?.hex ?? FALLBACK_HEX });
          }
          return {
            slug: p.slug,
            name: p.name,
            image: p.cardImage,
            price: Math.min(...p.variants.map((v) => v.basePrice)),
            colors: [...seen.values()],
          };
        }),
      },
    ];
  });

  res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  res.json({ category, sections });
}
