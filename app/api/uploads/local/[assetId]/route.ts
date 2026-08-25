import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { mediaAssets } from "@/db/schema";
import { db } from "@/lib/server/db";
import { verifyLocalUploadToken } from "@/lib/server/storage";

export const runtime = "nodejs";
export async function PUT(request: Request, { params }: RouteContext<"/api/uploads/local/[assetId]">) {
  if (process.env.NODE_ENV === "production" || process.env.STORAGE_ADAPTER === "s3") return NextResponse.json({ error: "Local upload disabled" }, { status: 404 });
  const { assetId } = await params;
  const url = new URL(request.url);
  const expires = Number(url.searchParams.get("expires"));
  const signature = url.searchParams.get("signature") ?? "";
  if (!verifyLocalUploadToken(assetId, expires, signature)) return NextResponse.json({ error: "Upload intent expired" }, { status: 403 });
  const asset = await db.query.mediaAssets.findFirst({ where: eq(mediaAssets.id, assetId) });
  if (!asset || asset.status !== "PENDING") return NextResponse.json({ error: "Upload is unavailable" }, { status: 409 });
  const contentType = request.headers.get("content-type")?.split(";")[0];
  if (contentType !== asset.mimeType) return NextResponse.json({ error: "MIME type does not match upload intent" }, { status: 422 });
  const body = Buffer.from(await request.arrayBuffer());
  if (body.byteLength <= 0 || body.byteLength > asset.bytes) return NextResponse.json({ error: "File size does not match upload intent" }, { status: 422 });
  const directory = path.resolve(process.env.LOCAL_UPLOAD_DIR ?? ".data/uploads");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, assetId), body, { flag: "wx" }).catch((error: NodeJS.ErrnoException) => { if (error.code !== "EEXIST") throw error; });
  await db.update(mediaAssets).set({ status: "READY", bytes: body.byteLength, updatedAt: new Date() }).where(eq(mediaAssets.id, assetId));
  return NextResponse.json({ ok: true, assetId });
}
