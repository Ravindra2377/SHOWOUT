import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { challenges, entries, moderationActions, normalizedResults, profileProofs, teamMembers, votes } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { challengeBySlug, runtimeState } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";
import { normalizedScore } from "@/lib/domain/scoring";

const input = z.object({ judgePickEntryId: z.string().uuid().optional(), minimumVotes: z.number().int().min(3).max(20).default(3) });
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = input.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid settlement configuration" }, { status: 400 });
  const { slug } = await params;
  const challenge = await challengeBySlug(slug);
  if (!challenge) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  if (!["VOTING_CLOSED", "SETTLED"].includes(challenge.derivedState)) return NextResponse.json({ error: "Voting must close before settlement" }, { status: 409 });

  const outcome = await db.transaction(async (tx) => {
    const current = await tx.query.challenges.findFirst({ where: eq(challenges.id, challenge.id) });
    if (!current || !["VOTING_CLOSED", "SETTLED"].includes(runtimeState(current))) return null;
    const eligibleEntries = await tx.select({ id: entries.id, creatorId: entries.creatorId, teamId: entries.teamId }).from(entries).where(and(eq(entries.challengeId, challenge.id), eq(entries.moderationStatus, "APPROVED"), inArray(entries.status, ["SUBMITTED","APPROVED"])));
    const settled: Array<{ entryId: string; score: number }> = [];
    const settledAt = new Date();
    for (const entry of eligibleEntries) {
      const ballot = await tx.select({ originality: votes.originality, execution: votes.execution, entertainment: votes.entertainment }).from(votes).where(eq(votes.entryId, entry.id));
      const score = normalizedScore(ballot, parsed.data.minimumVotes);
      if (score === null) continue;
      const mean = (key: "originality" | "execution" | "entertainment") => ballot.reduce((sum, vote) => sum + vote[key], 0) / ballot.length;
      await tx.insert(normalizedResults).values({ entryId: entry.id, challengeId: challenge.id, originality: mean("originality"), execution: mean("execution"), entertainment: mean("entertainment"), normalizedScore: score, eligibleVoteCount: ballot.length, communityPick: false, judgePick: parsed.data.judgePickEntryId === entry.id, settledAt }).onConflictDoUpdate({ target: normalizedResults.entryId, set: { originality: mean("originality"), execution: mean("execution"), entertainment: mean("entertainment"), normalizedScore: score, eligibleVoteCount: ballot.length, communityPick: false, judgePick: parsed.data.judgePickEntryId === entry.id, settledAt } });
      const proofUsers = new Set([entry.creatorId]);
      if (entry.teamId) {
        const members = await tx.select({ userId: teamMembers.userId, role: teamMembers.role }).from(teamMembers).where(and(eq(teamMembers.teamId, entry.teamId), eq(teamMembers.status, "ACTIVE")));
        for (const member of members) { proofUsers.add(member.userId); await tx.insert(profileProofs).values({ userId: member.userId, entryId: entry.id, challengeId: challenge.id, role: member.role }).onConflictDoNothing(); }
      }
      if (proofUsers.has(entry.creatorId)) await tx.insert(profileProofs).values({ userId: entry.creatorId, entryId: entry.id, challengeId: challenge.id, role: entry.teamId ? "Team creator" : "Creator" }).onConflictDoNothing();
      settled.push({ entryId: entry.id, score });
    }
    if (!settled.length) return { settled: 0 };
    const communityPick = settled.sort((a, b) => b.score - a.score || a.entryId.localeCompare(b.entryId))[0]!;
    await tx.update(normalizedResults).set({ communityPick: true }).where(eq(normalizedResults.entryId, communityPick.entryId));
    await tx.update(challenges).set({ state: "SETTLED", updatedAt: settledAt }).where(eq(challenges.id, challenge.id));
    await tx.insert(moderationActions).values({ adminId: user.id, subjectType: "CHALLENGE", subjectId: challenge.id, action: "SETTLE_RESULTS", rationale: `Settled ${settled.length} eligible entries with minimum ${parsed.data.minimumVotes} votes.` });
    return { settled: settled.length, communityPickEntryId: communityPick.entryId };
  });
  if (!outcome) return NextResponse.json({ error: "Challenge state changed before settlement" }, { status: 409 });
  if (!outcome.settled) return NextResponse.json({ error: "No entry met the minimum vote threshold" }, { status: 422 });
  return NextResponse.json(outcome);
}
