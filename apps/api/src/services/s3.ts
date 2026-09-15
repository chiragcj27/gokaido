import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "ap-south-1";
const bucket = process.env.AWS_S3_BUCKET ?? "";

const client = new S3Client({ region });

const PRESIGN_EXPIRY_SECONDS = 5 * 60;

// Public bucket policy only grants s3:GetObject under this prefix — anything
// meant to render on the storefront (product/review/blog media) must live here.
const PUBLIC_PREFIX = "public";

export function buildPublicKey(folder: string, fileName: string): string {
  const ext = fileName.includes(".") ? fileName.slice(fileName.lastIndexOf(".")) : "";
  return `${PUBLIC_PREFIX}/${folder}/${crypto.randomUUID()}${ext.toLowerCase()}`;
}

const PUBLIC_BASE_URL = `https://${bucket}.s3.${region}.amazonaws.com/${PUBLIC_PREFIX}/`;

export function publicUrlForKey(key: string): string {
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

// Guards product/review/blog media fields against arbitrary hotlinked URLs —
// only assets actually uploaded through the presign flow are accepted.
export function isOwnPublicUrl(url: string): boolean {
  return url.startsWith(PUBLIC_BASE_URL);
}

export async function createPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRY_SECONDS });
}

export async function uploadBufferToS3(
  key: string,
  buffer: Buffer,
  contentType: string
): Promise<void> {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }));
}
