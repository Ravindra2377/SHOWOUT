import { NextResponse } from "next/server";
import { z } from "zod";
import { mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { challengeBySlug } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";
import { recordEvent } from "@/lib/server/analytics-db";
import { rateLimit } from "@/lib/server/rate-limit";
import { storageAdapter } from "@/lib/server/storage";

const input = z.object({ challengeSlug: z.string().min(1), mimeType: z.enum(["video/mp4","video/webm","video/quicktime"]), bytes: z.number().int().positive(), durationSeconds: z.number().positive() });
export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!rateLimit(`upload:${user.id}`, 8, 60_000).allowed) return NextResponse.json({ error: "Upload rate limit reached" }, { status: 429 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload metadata", issues: parsed.error.issues }, { status: 400 });
  const challenge = await challengeBySlug(parsed.data.challengeSlug);
  if (!challenge || challenge.derivedState !== "OPEN") return NextResponse.json({ error: "Challenge is not accepting entries" }, { status: 409 });
  if (parsed.data.bytes > challenge.maxBytes || parsed.data.durationSeconds > challenge.maxDurationSeconds || !challenge.acceptedMimeTypes.includes(parsed.data.mimeType)) return NextResponse.json({ error: "Media exceeds challenge limits" }, { status: 422 });
  const intent = await storageAdapter.createUploadIntent({ userId: user.id, mimeType: parsed.data.mimeType, bytes: parsed.data.bytes });
  await db.insert(mediaAssets).values({ id: intent.assetId, ownerId: user.id, objectKey: intent.objectKey, mimeType: parsed.data.mimeType, bytes: parsed.data.bytes, durationSeconds: parsed.data.durationSeconds, status: process.env.STORAGE_ADAPTER === "s3" ? "UPLOADING" : "PENDING" });
  await recordEvent("upload_started", user.id, { bytes: parsed.data.bytes }, challenge.id);
  return NextResponse.json(intent, { status: 201 });
}
