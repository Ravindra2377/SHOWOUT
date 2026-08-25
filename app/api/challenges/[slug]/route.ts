import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { entries } from "@/db/schema";
import { currentUser } from "@/lib/server/auth";
import { challengeBySlug } from "@/lib/server/challenges";
import { db } from "@/lib/server/db";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const challenge = await challengeBySlug(slug);
  if (!challenge || !challenge.published) return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
  const user = await currentUser(request);
  const entry = user ? await db.query.entries.findFirst({ where: and(eq(entries.challengeId, challenge.id), eq(entries.creatorId, user.id)) }) : null;
  return NextResponse.json({ challenge: {
    ...challenge,
    state: challenge.derivedState,
    opensAt: challenge.opensAt.toISOString(), submissionClosesAt: challenge.submissionClosesAt.toISOString(), revealOpensAt: challenge.revealOpensAt.toISOString(), votingClosesAt: challenge.votingClosesAt.toISOString(), settlesAt: challenge.settlesAt.toISOString(),
    coverUrl: challenge.coverKey,
    entryStatus: entry?.status ?? null,
  } }, { headers: { "cache-control": "no-store" } });
}
