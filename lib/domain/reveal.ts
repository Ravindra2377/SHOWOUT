import type { RevealEntry } from "../types";

export function anonymousRevealPayload(entry: RevealEntry) {
  const safe = { ...entry };
  delete safe.creator;
  return safe;
}

export function mayVote(params: { voterId: string; creatorId: string; voterTeamIds: string[]; creatorTeamId?: string; alreadyVoted: boolean }) {
  if (params.alreadyVoted || params.voterId === params.creatorId) return false;
  return !params.creatorTeamId || !params.voterTeamIds.includes(params.creatorTeamId);
}
