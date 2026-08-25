import { NextResponse } from "next/server";
import { count, eq, sql } from "drizzle-orm";
import { challenges, entries, normalizedResults, profileProofs, profiles } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
  const stats = await db.select({ challenges: count(profileProofs.id), communityPicks: sql<number>`count(*) filter (where ${normalizedResults.communityPick} = true)`, judgePicks: sql<number>`count(*) filter (where ${normalizedResults.judgePick} = true)` })
    .from(profileProofs).leftJoin(normalizedResults, eq(normalizedResults.entryId, profileProofs.entryId)).where(eq(profileProofs.userId, user.id));
  const proofs = await db.select({ id: profileProofs.id, role: profileProofs.role, challengeNumber: challenges.number, title: challenges.title, score: normalizedResults.normalizedScore, communityPick: normalizedResults.communityPick, judgePick: normalizedResults.judgePick, coverUrl: challenges.coverKey })
    .from(profileProofs).innerJoin(challenges, eq(challenges.id, profileProofs.challengeId)).innerJoin(normalizedResults, eq(normalizedResults.entryId, profileProofs.entryId)).where(eq(profileProofs.userId, user.id));
  const entered = await db.$count(entries, eq(entries.creatorId, user.id));
  const completed = Number(stats[0]?.challenges ?? 0);
  return NextResponse.json({ profile: { ...user, bio: profile?.bio ?? "", avatarUrl: profile?.avatarKey, challenges: completed, communityPicks: Number(stats[0]?.communityPicks ?? 0), judgePicks: Number(stats[0]?.judgePicks ?? 0), completionRate: entered ? Math.round((completed / entered) * 100) : 0, proofs } }, { headers: { "cache-control": "private, no-store" } });
}
