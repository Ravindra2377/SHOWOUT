import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { challenges, entries, profiles, teamMembers, votes, votingAssignments } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { runtimeState } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";
import { recordEvent } from "@/lib/server/analytics-db";
import { mayVote } from "@/lib/domain/reveal";
import { validateScores } from "@/lib/domain/scoring";
import { rateLimit } from "@/lib/server/rate-limit";

const input = z.object({ assignmentId: z.string().uuid(), entryId: z.string().uuid(), originality: z.number().int(), execution: z.number().int(), entertainment: z.number().int(), elapsedMs: z.number().int().nonnegative(), deviceSignal: z.string().max(200).optional() });
export async function POST(request: Request) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (!rateLimit(`vote:${user.id}`, 20, 60_000).allowed) return NextResponse.json({ error: "Vote rate limit reached" }, { status: 429 });
  const parsed = input.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !validateScores(parsed.success ? { originality: parsed.data.originality, execution: parsed.data.execution, entertainment: parsed.data.entertainment } : { originality: 0, execution: 0, entertainment: 0 })) return NextResponse.json({ error: "Scores must be integers from 1 to 5" }, { status: 400 });
  try {
    const result = await db.transaction(async (tx) => {
      const assignment = await tx.query.votingAssignments.findFirst({ where: and(eq(votingAssignments.id, parsed.data.assignmentId), eq(votingAssignments.entryId, parsed.data.entryId), eq(votingAssignments.voterId, user.id)) });
      if (!assignment) return { error: "Assignment not found", status: 404 } as const;
      const entry = await tx.query.entries.findFirst({ where: eq(entries.id, assignment.entryId) });
      const challenge = await tx.query.challenges.findFirst({ where: eq(challenges.id, assignment.challengeId) });
      if (!entry || !challenge || runtimeState(challenge) !== "REVEAL_LIVE") return { error: "Voting is closed", status: 409 } as const;
      const existing = await tx.query.votes.findFirst({ where: eq(votes.assignmentId, assignment.id) });
      const teams = await tx.select({ teamId: teamMembers.teamId }).from(teamMembers).where(and(eq(teamMembers.userId, user.id), eq(teamMembers.status, "ACTIVE")));
      if (!mayVote({ voterId: user.id, creatorId: entry.creatorId, voterTeamIds: teams.map((team) => team.teamId), creatorTeamId: entry.teamId ?? undefined, alreadyVoted: Boolean(existing) })) return { error: existing ? "Vote is already locked" : "Self and team voting is not allowed", status: existing ? 409 : 403 } as const;
      await tx.insert(votes).values({ assignmentId: assignment.id, voterId: user.id, entryId: entry.id, originality: parsed.data.originality, execution: parsed.data.execution, entertainment: parsed.data.entertainment, elapsedMs: parsed.data.elapsedMs, deviceSignalHash: parsed.data.deviceSignal ? createHash("sha256").update(parsed.data.deviceSignal).digest("hex") : null });
      const creator = await tx.select({ handle: profiles.handle, displayName: profiles.displayName, avatarKey: profiles.avatarKey }).from(profiles).where(eq(profiles.userId, entry.creatorId)).limit(1);
      return { creator: creator[0]!, challengeId: challenge.id, entryId: entry.id } as const;
    });
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });
    await recordEvent("vote_locked", user.id, { fastVoteSignal: parsed.data.elapsedMs < 4000 }, result.challengeId);
    await recordEvent("identity_revealed", user.id, { entryId: result.entryId }, result.challengeId);
    return NextResponse.json({ locked: true, creator: { handle: result.creator.handle, displayName: result.creator.displayName, avatarUrl: result.creator.avatarKey } }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "Vote is already locked" }, { status: 409 });
    throw error;
  }
}
