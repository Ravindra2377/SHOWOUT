import type { ChallengeState } from "../types";

export interface LifecycleDates {
  opensAt: Date; submissionClosesAt: Date; revealOpensAt: Date; votingClosesAt: Date; settlesAt: Date;
  published: boolean; archived?: boolean;
}

export function deriveChallengeState(dates: LifecycleDates, now: Date): ChallengeState {
  if (dates.archived) return "ARCHIVED";
  if (!dates.published) return "DRAFT";
  if (now < dates.opensAt) return "UPCOMING";
  if (now < dates.submissionClosesAt) return "OPEN";
  if (now < dates.revealOpensAt) return "SUBMISSION_CLOSED";
  if (now < dates.votingClosesAt) return "REVEAL_LIVE";
  if (now < dates.settlesAt) return "VOTING_CLOSED";
  return "SETTLED";
}

export function canEnter(state: ChallengeState) { return state === "OPEN"; }
export function canVote(state: ChallengeState) { return state === "REVEAL_LIVE"; }
