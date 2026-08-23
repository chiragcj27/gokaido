import type { ProductType, Sport } from "@gokaido/database";

// Google product taxonomy paths (https://support.google.com/merchants/answer/6324436).
// These two are IDs verified against Google's published taxonomy:
//   4003   Apparel & Accessories > Clothing > Uniforms > Sports Uniforms > Martial Arts Uniforms
//   499719 Sporting Goods > Athletics > Boxing & Martial Arts
// The equipment mapping is deliberately coarse (one category for all sports/gear) since
// Google's finer subcategories (gloves vs. headgear vs. pads, per combat sport) couldn't be
// verified without a live product catalog to test against. Before relying on this for a real
// Merchant Center submission, someone should walk the actual product list against Google's
// taxonomy browser and add sport/category-specific overrides below where a closer match exists.
const UNIFORM_CATEGORY = "Apparel & Accessories > Clothing > Uniforms > Sports Uniforms > Martial Arts Uniforms";
const EQUIPMENT_CATEGORY = "Sporting Goods > Athletics > Boxing & Martial Arts";

export function getGoogleProductCategory(productType: ProductType, _sport: Sport): string {
  return productType === "uniform" ? UNIFORM_CATEGORY : EQUIPMENT_CATEGORY;
}
