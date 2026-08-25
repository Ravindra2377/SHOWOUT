import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { entries, normalizedResults, profiles } from "@/db/schema";
import { challengeBySlug } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = await challengeBySlug(slug);
  if (!challenge || !["SETTLED","ARCHIVED"].includes(challenge.derivedState)) return NextResponse.json({ error: "Results are not available" }, { status: 409 });
  const results = await db.select({ entryId: entries.id, caption: entries.caption, originality: normalizedResults.originality, execution: normalizedResults.execution, entertainment: normalizedResults.entertainment, normalizedScore: normalizedResults.normalizedScore, voteCount: normalizedResults.eligibleVoteCount, communityPick: normalizedResults.communityPick, judgePick: normalizedResults.judgePick, handle: profiles.handle, displayName: profiles.displayName, avatarUrl: profiles.avatarKey })
    .from(normalizedResults).innerJoin(entries, eq(entries.id, normalizedResults.entryId)).innerJoin(profiles, eq(profiles.userId, entries.creatorId)).where(eq(normalizedResults.challengeId, challenge.id)).orderBy(desc(normalizedResults.normalizedScore));
  return NextResponse.json({ challenge: { number: challenge.number, title: challenge.title }, results }, { headers: { "cache-control": "no-store" } });
}
