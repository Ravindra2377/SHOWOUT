import "server-only";
import { and, asc, eq, isNull } from "drizzle-orm";
import { challengeRules, challenges, entries } from "@/db/schema";
import { deriveChallengeState } from "@/lib/domain/lifecycle";
import { db } from "@/lib/server/db";

export type RuntimeChallenge = typeof challenges.$inferSelect & {
  rules: string[];
  derivedState: ReturnType<typeof deriveChallengeState>;
};

export function runtimeState(challenge: typeof challenges.$inferSelect, now = new Date()) {
  return deriveChallengeState({
    opensAt: challenge.opensAt,
    submissionClosesAt: challenge.submissionClosesAt,
    revealOpensAt: challenge.revealOpensAt,
    votingClosesAt: challenge.votingClosesAt,
    settlesAt: challenge.settlesAt,
    published: challenge.published,
    archived: challenge.state === "ARCHIVED",
  }, now);
}

export async function challengeBySlug(slug: string): Promise<RuntimeChallenge | null> {
  const challenge = await db.query.challenges.findFirst({ where: and(eq(challenges.slug, slug), isNull(challenges.deletedAt)) });
  if (!challenge) return null;
  const rules = await db.select({ text: challengeRules.text }).from(challengeRules).where(eq(challengeRules.challengeId, challenge.id)).orderBy(asc(challengeRules.position));
  return { ...challenge, rules: rules.map((rule) => rule.text), derivedState: runtimeState(challenge) };
}

export async function publicChallenges() {
  const rows = await db.query.challenges.findMany({ where: and(eq(challenges.published, true), isNull(challenges.deletedAt)), orderBy: [asc(challenges.number)] });
  return Promise.all(rows.map(async (challenge) => {
    const rules = await db.select({ text: challengeRules.text }).from(challengeRules).where(eq(challengeRules.challengeId, challenge.id)).orderBy(asc(challengeRules.position));
    const approvedEntries = await db.$count(entries, and(eq(entries.challengeId, challenge.id), eq(entries.moderationStatus, "APPROVED")));
    return { ...challenge, state: runtimeState(challenge), rules: rules.map((rule) => rule.text), entryCount: approvedEntries };
  }));
}
