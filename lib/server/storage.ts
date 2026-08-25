import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface UploadIntent { assetId: string; objectKey: string; uploadUrl: string; method: "PUT"; headers: Record<string,string>; expiresInSeconds: number; }
export interface ObjectStorageAdapter { createUploadIntent(input: { userId: string; mimeType: string; bytes: number }): Promise<UploadIntent>; }
const uploadSecret = () => process.env.AUTH_SECRET ?? "showout-local-development-secret-only";
const uploadSignature = (assetId: string, expires: number) => createHmac("sha256", uploadSecret()).update(`${assetId}:${expires}`).digest("base64url");
export function verifyLocalUploadToken(assetId: string, expires: number, signature: string) {
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expected = Buffer.from(uploadSignature(assetId, expires));
  const received = Buffer.from(signature);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
class LocalStorageAdapter implements ObjectStorageAdapter {
  async createUploadIntent(input: { userId: string; mimeType: string }) {
    const assetId = randomUUID();
    const expires = Date.now() + 10 * 60_000;
    return { assetId, objectKey: `local/${input.userId}/${assetId}`, uploadUrl: `/api/uploads/local/${assetId}?expires=${expires}&signature=${encodeURIComponent(uploadSignature(assetId, expires))}`, method: "PUT" as const, headers: { "content-type": input.mimeType }, expiresInSeconds: 600 };
  }
}
class S3StorageAdapter implements ObjectStorageAdapter {
  private client = new S3Client({ region: process.env.S3_REGION ?? "auto", endpoint: process.env.S3_ENDPOINT, credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined });
  async createUploadIntent(input: { userId: string; mimeType: string }) {
    const assetId = randomUUID();
    const objectKey = `entries/${input.userId}/${assetId}`;
    const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: objectKey, ContentType: input.mimeType });
    return { assetId, objectKey, uploadUrl: await getSignedUrl(this.client, command, { expiresIn: 600 }), method: "PUT" as const, headers: { "content-type": input.mimeType }, expiresInSeconds: 600 };
  }
}
export const storageAdapter: ObjectStorageAdapter = process.env.STORAGE_ADAPTER === "s3" ? new S3StorageAdapter() : new LocalStorageAdapter();
