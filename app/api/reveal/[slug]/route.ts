import { NextResponse } from "next/server";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { entries, mediaAssets, teamMembers, votes, votingAssignments } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { challengeBySlug } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";
import { recordEvent } from "@/lib/server/analytics-db";

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index--) { const swap = Math.floor(Math.random() * (index + 1)); [copy[index], copy[swap]] = [copy[swap]!, copy[index]!]; }
  return copy;
}
export async function GET(request: Request, { params }: RouteContext<"/api/reveal/[slug]">) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { slug } = await params;
  const challenge = await challengeBySlug(slug);
  if (!challenge || challenge.derivedState !== "REVEAL_LIVE") return NextResponse.json({ error: "Reveal is not live" }, { status: 409 });

  let assigned = await db.select({ assignmentId: votingAssignments.id, entryId: entries.id, position: votingAssignments.position, caption: entries.caption, duration: mediaAssets.durationSeconds })
    .from(votingAssignments).innerJoin(entries, eq(entries.id, votingAssignments.entryId)).innerJoin(mediaAssets, eq(mediaAssets.id, entries.mediaAssetId)).leftJoin(votes, eq(votes.assignmentId, votingAssignments.id))
    .where(and(eq(votingAssignments.challengeId, challenge.id), eq(votingAssignments.voterId, user.id), isNull(votes.id))).orderBy(asc(votingAssignments.position));
  if (!assigned.length) {
    const teamRows = await db.select({ teamId: teamMembers.teamId }).from(teamMembers).where(and(eq(teamMembers.userId, user.id), eq(teamMembers.status, "ACTIVE")));
    const teamIds = new Set(teamRows.map((row) => row.teamId));
    const candidates = await db.select({ entryId: entries.id, creatorId: entries.creatorId, teamId: entries.teamId, caption: entries.caption, duration: mediaAssets.durationSeconds })
      .from(entries).innerJoin(mediaAssets, eq(mediaAssets.id, entries.mediaAssetId))
      .where(and(eq(entries.challengeId, challenge.id), inArray(entries.status, ["SUBMITTED","APPROVED"]), eq(entries.moderationStatus, "APPROVED"), eq(mediaAssets.status, "READY")));
    const eligible = shuffle(candidates.filter((entry) => entry.creatorId !== user.id && (!entry.teamId || !teamIds.has(entry.teamId)))).slice(0, 5);
    if (eligible.length) await db.insert(votingAssignments).values(eligible.map((entry, index) => ({ challengeId: challenge.id, voterId: user.id, entryId: entry.entryId, position: index + 1 }))).onConflictDoNothing();
    assigned = await db.select({ assignmentId: votingAssignments.id, entryId: entries.id, position: votingAssignments.position, caption: entries.caption, duration: mediaAssets.durationSeconds })
      .from(votingAssignments).innerJoin(entries, eq(entries.id, votingAssignments.entryId)).innerJoin(mediaAssets, eq(mediaAssets.id, entries.mediaAssetId)).leftJoin(votes, eq(votes.assignmentId, votingAssignments.id))
      .where(and(eq(votingAssignments.challengeId, challenge.id), eq(votingAssignments.voterId, user.id), isNull(votes.id))).orderBy(asc(votingAssignments.position));
  }
  await recordEvent("reveal_viewed", user.id, {}, challenge.id);
  return NextResponse.json({ challenge: { id: challenge.id, slug: challenge.slug, number: challenge.number, title: challenge.title, judgingDimensions: challenge.judgingDimensions }, assignments: assigned.map((assignment) => ({ assignmentId: assignment.assignmentId, entryId: assignment.entryId, position: assignment.position, total: assigned.length, duration: assignment.duration, caption: assignment.caption, videoUrl: `/api/media/${assignment.entryId}` })) }, { headers: { "cache-control": "private, no-store" } });
}
