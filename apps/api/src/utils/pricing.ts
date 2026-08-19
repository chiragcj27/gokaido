export interface VariantPricing {
  basePrice: number;
  regionPrices?: Record<string, number>;
}

export function getEffectivePrice(variant: VariantPricing, region?: string): number {
  if (!region) return variant.basePrice;
  const override = variant.regionPrices?.[region];
  return override ?? variant.basePrice;
}
