export type ChallengeState = "DRAFT" | "UPCOMING" | "OPEN" | "SUBMISSION_CLOSED" | "REVEAL_LIVE" | "VOTING_CLOSED" | "SETTLED" | "ARCHIVED";
export type AgeBand = "13_15" | "16_17" | "18_24" | "25_34" | "35_PLUS";

export interface Challenge {
  id: string; number: number; slug: string; title: string; brief: string; description: string;
  state: ChallengeState; opensAt: string; submissionClosesAt: string; revealOpensAt: string;
  votingClosesAt: string; settlesAt: string; maxDurationSeconds: number; maxBytes: number;
  acceptedMimeTypes: string[]; judgingDimensions: string[]; rules: string[]; skills: string[];
  cover: string; accent: "red" | "blue" | "lime"; entryCount: number;
}

export interface Proof {
  id: string; challengeNumber: number; title: string; role: string; cover: string;
  award?: "COMMUNITY PICK" | "JUDGE PICK"; score: number;
}

export interface PilotProfile {
  id: string; handle: string; displayName: string; bio: string; ageBand: AgeBand; avatar: string;
  challenges: number; communityPicks: number; judgePicks: number; completionRate: number;
  skills: Array<{ name: string; proofs: number }>; roles: string[]; proofs: Proof[];
}

export interface RevealEntry {
  assignmentId: string; entryId: string; position: number; total: number; videoUrl: string;
  duration: number; caption?: string; creator?: Pick<PilotProfile, "handle" | "displayName" | "avatar">;
}

export interface InboxItem {
  id: string; handle: string; displayName: string; avatar: string; preview: string; time: string;
  unread: number; context: string; state: "ACTIVE" | "REQUESTED"; kind: "message" | "request" | "team";
  mutualConnection?: boolean;
  sharedChallenge?: boolean;
  sharedTeam?: boolean;
  acceptedRequest?: boolean;
  pilotEnabled?: boolean;
  ageBand?: AgeBand;
}
