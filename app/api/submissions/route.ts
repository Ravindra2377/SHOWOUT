import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { entries, mediaAssets, termsAcceptances, termsVersions } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { challengeBySlug, runtimeState } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";
import { recordEvent } from "@/lib/server/analytics-db";

const input = z.object({
  challengeSlug: z.string().min(1), assetId: z.string().uuid(), caption: z.string().trim().max(200),
  rulesAccepted: z.literal(true), rightsTermsVersion: z.literal("1.1"), idempotencyKey: z.string().min(8).max(100), aiMediaDisclosed: z.boolean(),
});
export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Submission validation failed", issues: parsed.error.issues }, { status: 400 });
  const challenge = await challengeBySlug(parsed.data.challengeSlug);
  if (!challenge || challenge.derivedState !== "OPEN") return NextResponse.json({ error: "Submission deadline has passed" }, { status: 409 });

  const outcome = await db.transaction(async (tx) => {
    const existingByKey = await tx.query.entries.findFirst({ where: eq(entries.idempotencyKey, parsed.data.idempotencyKey) });
    if (existingByKey) {
      if (existingByKey.creatorId !== user.id) return { error: "Idempotency key is already in use", status: 409 } as const;
      return { entry: existingByKey, replay: true } as const;
    }
    const currentChallenge = await tx.query.challenges.findFirst({ where: eq((await import("@/db/schema")).challenges.id, challenge.id) });
    if (!currentChallenge || runtimeState(currentChallenge) !== "OPEN") return { error: "Submission deadline has passed", status: 409 } as const;
    const asset = await tx.query.mediaAssets.findFirst({ where: and(eq(mediaAssets.id, parsed.data.assetId), eq(mediaAssets.ownerId, user.id)) });
    if (!asset || asset.status !== "READY") return { error: "Upload is not complete", status: 422 } as const;
    if (!currentChallenge.acceptedMimeTypes.includes(asset.mimeType) || asset.bytes > currentChallenge.maxBytes || !asset.durationSeconds || asset.durationSeconds > currentChallenge.maxDurationSeconds) return { error: "Uploaded media exceeds challenge limits", status: 422 } as const;
    const prior = await tx.query.entries.findFirst({ where: and(eq(entries.challengeId, challenge.id), eq(entries.creatorId, user.id)) });
    if (prior?.status === "SUBMITTED" || prior?.status === "APPROVED") return { error: "An entry is already submitted for this challenge", status: 409 } as const;
    const terms = await tx.query.termsVersions.findFirst({ where: and(eq(termsVersions.kind, "CONTENT_RIGHTS"), eq(termsVersions.version, parsed.data.rightsTermsVersion)) });
    if (!terms) return { error: "Content rights terms are unavailable", status: 503 } as const;
    await tx.insert(termsAcceptances).values({ userId: user.id, termsVersionId: terms.id, challengeId: challenge.id }).onConflictDoNothing();
    const now = new Date();
    const inserted = prior
      ? await tx.update(entries).set({ mediaAssetId: asset.id, caption: parsed.data.caption, status: "SUBMITTED", moderationStatus: "PENDING", aiMediaDisclosed: parsed.data.aiMediaDisclosed, submittedAt: now, lockedAt: null, idempotencyKey: parsed.data.idempotencyKey, updatedAt: now }).where(eq(entries.id, prior.id)).returning()
      : await tx.insert(entries).values({ challengeId: challenge.id, creatorId: user.id, mediaAssetId: asset.id, caption: parsed.data.caption, status: "SUBMITTED", moderationStatus: "PENDING", aiMediaDisclosed: parsed.data.aiMediaDisclosed, submittedAt: now, idempotencyKey: parsed.data.idempotencyKey }).returning();
    return { entry: inserted[0]!, replay: false } as const;
  });
  if ("error" in outcome) return NextResponse.json({ error: outcome.error }, { status: outcome.status });
  if (!outcome.replay) await recordEvent("entry_submitted", user.id, {}, challenge.id);
  return NextResponse.json({ entryId: outcome.entry.id, status: outcome.entry.status, hidden: true, lockedAt: outcome.entry.lockedAt?.toISOString() ?? null }, { status: outcome.replay ? 200 : 201 });
}
