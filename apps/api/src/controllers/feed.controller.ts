import type { Request, Response } from "express";
import { Product, type IProductVariant } from "@gokaido/database";
import { slugify } from "../utils/slug.js";
import { getGoogleProductCategory } from "../utils/googleCategory.js";

const BRAND = "Gokaido";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toAbsoluteUrl(pathOrUrl: string, base: string): string {
  return /^https?:\/\//i.test(pathOrUrl) ? pathOrUrl : `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} INR`;
}

type FeedProduct = {
  _id: unknown;
  name: string;
  slug: string;
  sport: Parameters<typeof getGoogleProductCategory>[1];
  productType: Parameters<typeof getGoogleProductCategory>[0];
  description?: string;
  images: string[];
  isActive: boolean;
  variants: IProductVariant[];
};

function buildItemXml(
  product: FeedProduct,
  variant: IProductVariant,
  siteUrl: string
): string {
  const colorSlug = slugify(variant.color);
  const link = `${siteUrl}/products/${product.slug}/${colorSlug}?size=${encodeURIComponent(variant.size)}`;
  const image = variant.images[0] ?? product.images[0];
  const availability = variant.isActive && variant.stock > 0 ? "in_stock" : "out_of_stock";
  const title = `${product.name} - ${variant.color}`;
  const description = product.description?.trim() || product.name;

  const fields: Array<[string, string]> = [
    ["g:id", variant.sku],
    ["title", title],
    ["description", description],
    ["link", link],
    ["g:availability", availability],
    ["g:price", formatPrice(variant.basePrice)],
    ["g:brand", BRAND],
    ["g:condition", "new"],
    ["g:color", variant.color],
    ["g:size", variant.size],
    ["g:item_group_id", product.slug],
    ["g:mpn", variant.sku],
    ["g:identifier_exists", "no"],
    ["g:google_product_category", getGoogleProductCategory(product.productType, product.sport)],
  ];

  const fieldXml = fields.map(([tag, value]) => `<${tag}>${escapeXml(value)}</${tag}>`).join("\n      ");
  const imageXml = image ? `\n      <g:image_link>${escapeXml(toAbsoluteUrl(image, siteUrl))}</g:image_link>` : "";

  return `    <item>\n      ${fieldXml}${imageXml}\n    </item>`;
}

export async function getGoogleShoppingFeed(_req: Request, res: Response): Promise<void> {
  const siteUrl = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const products = (await Product.find({ isActive: true }).lean()) as unknown as FeedProduct[];

  const items = products.flatMap((product) =>
    product.variants
      .filter((v) => v.isActive)
      .map((variant) => buildItemXml(product, variant, siteUrl))
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Gokaido Product Feed</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>Gokaido product feed for Google Shopping</description>
${items.join("\n")}
  </channel>
</rss>
`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
}
