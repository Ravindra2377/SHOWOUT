import type { AgeBand } from "../types";

export interface MessagingContext {
  mutualConnection: boolean; sharedChallenge: boolean; sharedTeam: boolean; acceptedRequest: boolean;
  pilotEnabled: boolean; blocked: boolean; priorDecline: boolean; senderAgeBand: AgeBand; recipientAgeBand: AgeBand;
}

const isAdult = (band: AgeBand) => !["13_15", "16_17"].includes(band);
const isMinor = (band: AgeBand) => !isAdult(band);

export function messagingEligibility(context: MessagingContext): "ACTIVE" | "REQUEST" | "DENIED" {
  if (context.blocked || context.priorDecline) return "DENIED";
  const approvedMinorContext = context.sharedChallenge || context.sharedTeam || context.mutualConnection;
  if (isAdult(context.senderAgeBand) && isMinor(context.recipientAgeBand) && !approvedMinorContext) return "DENIED";
  if (context.sharedChallenge || context.sharedTeam || context.mutualConnection || context.acceptedRequest || context.pilotEnabled) return "ACTIVE";
  return "REQUEST";
}
