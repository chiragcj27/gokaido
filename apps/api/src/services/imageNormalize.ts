import sharp from "sharp";

// Matches the framing apps/web's PoppedCard.tsx was hand-tuned against
// (product-placeholder.png: subject ~78% height, centered)
// so its fixed scale/offset pop effect works the same for every upload.
const CANVAS = { width: 1000, height: 1000 };
// Height is the dimension that drives the pop-out above the card's background, so it is fixed;
// width is only a generous cap (PoppedCard's scaled image spans the full card width at 1000px), so
// square or moderately wide subjects reach the same height as tall ones instead of stopping short.
const INNER_BOX = { width: 900, height: 780 };

export async function normalizeCutoutImage(input: Buffer): Promise<Buffer> {
  const trimmed = await sharp(input).trim().toBuffer();
  const resized = await sharp(trimmed)
    // Upscale small cutouts too — otherwise a small upload keeps its tiny trimmed size inside the
    // canvas and renders far smaller than a large one.
    .resize({ width: INNER_BOX.width, height: INNER_BOX.height, fit: "inside" })
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
