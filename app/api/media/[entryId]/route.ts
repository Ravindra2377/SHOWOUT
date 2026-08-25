import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { challenges, entries, mediaAssets } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { runtimeState } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";

export const runtime = "nodejs";
export async function GET(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { entryId } = await params;
  const rows = await db.select({ creatorId: entries.creatorId, moderationStatus: entries.moderationStatus, assetId: mediaAssets.id, objectKey: mediaAssets.objectKey, mimeType: mediaAssets.mimeType, challenge: challenges })
    .from(entries).innerJoin(mediaAssets, eq(mediaAssets.id, entries.mediaAssetId)).innerJoin(challenges, eq(challenges.id, entries.challengeId)).where(eq(entries.id, entryId)).limit(1);
  const row = rows[0];
  if (!row) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  const state = runtimeState(row.challenge);
  const publiclyRevealable = row.moderationStatus === "APPROVED" && ["REVEAL_LIVE","VOTING_CLOSED","SETTLED","ARCHIVED"].includes(state);
  if (row.creatorId !== user.id && !publiclyRevealable) return NextResponse.json({ error: "Media not found" }, { status: 404 });
  if (row.objectKey.startsWith("https://")) return NextResponse.redirect(row.objectKey, 307);
  const file = path.join(path.resolve(/*turbopackIgnore: true*/ process.env.LOCAL_UPLOAD_DIR ?? ".data/uploads"), row.assetId);
  const info = await stat(/* turbopackIgnore: true */ file).catch(() => null);
  if (!info) return NextResponse.json({ error: "Media unavailable" }, { status: 404 });
  return new Response(Readable.toWeb(createReadStream(/* turbopackIgnore: true */ file)) as ReadableStream, { headers: { "content-type": row.mimeType, "content-length": String(info.size), "cache-control": "private, max-age=60" } });
}
