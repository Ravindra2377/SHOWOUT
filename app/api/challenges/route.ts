import { NextResponse } from "next/server";
import { publicChallenges } from "@/lib/server/challenges";

export async function GET() {
  const rows = await publicChallenges();
  return NextResponse.json({ challenges: rows.map((challenge) => ({
    id: challenge.id,
    number: challenge.number,
    slug: challenge.slug,
    title: challenge.title,
    brief: challenge.brief,
    description: challenge.description,
    state: challenge.state,
    opensAt: challenge.opensAt.toISOString(),
    submissionClosesAt: challenge.submissionClosesAt.toISOString(),
    revealOpensAt: challenge.revealOpensAt.toISOString(),
    votingClosesAt: challenge.votingClosesAt.toISOString(),
    settlesAt: challenge.settlesAt.toISOString(),
    maxDurationSeconds: challenge.maxDurationSeconds,
    maxBytes: challenge.maxBytes,
    acceptedMimeTypes: challenge.acceptedMimeTypes,
    judgingDimensions: challenge.judgingDimensions,
    rules: challenge.rules,
    coverUrl: challenge.coverKey,
    entryCount: challenge.entryCount,
  })) }, { headers: { "cache-control": "no-store" } });
}
