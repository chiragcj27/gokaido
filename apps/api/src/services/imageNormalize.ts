import sharp from "sharp";

// Matches the framing apps/web's PoppedCard.tsx was hand-tuned against
// (product-placeholder.png: subject bbox ~55% width / ~78% height, centered)
// so its fixed scale/offset pop effect works the same for every upload.
const CANVAS = { width: 1000, height: 1000 };
const INNER_BOX = { width: 550, height: 780 };

export async function normalizeCutoutImage(input: Buffer): Promise<Buffer> {
  const trimmed = await sharp(input).trim().toBuffer();
  const resized = await sharp(trimmed)
    .resize({ width: INNER_BOX.width, height: INNER_BOX.height, fit: "inside", withoutEnlargement: true })
    .toBuffer();
  const { width = INNER_BOX.width, height = INNER_BOX.height } = await sharp(resized).metadata();
  const left = Math.round((CANVAS.width - width) / 2);
  const top = Math.round((CANVAS.height - height) / 2);

  return sharp({
    create: { width: CANVAS.width, height: CANVAS.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer();
}
