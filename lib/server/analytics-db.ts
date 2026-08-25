import "server-only";
import { analyticsEvents } from "@/db/schema";
import { db } from "@/lib/server/db";

const allowed = new Set(["onboarding_completed","challenge_viewed","challenge_entered","upload_started","upload_completed","entry_submitted","reveal_viewed","vote_locked","identity_revealed","invitation_created","invitation_opened","team_invitation_accepted","results_viewed","second_challenge_entered","message_request_sent","message_request_accepted","message_request_declined","conversation_started","team_invitation_sent_through_message","block_performed","report_submitted"]);
export async function recordEvent(name: string, userId?: string, metadata: Record<string, string | number | boolean> = {}, challengeId?: string) {
  if (!allowed.has(name)) throw new Error("Unknown analytics event");
  const forbidden = ["body", "message", "text", "content"];
  if (Object.keys(metadata).some((key) => forbidden.includes(key.toLowerCase()))) throw new Error("Private content cannot enter analytics");
  await db.insert(analyticsEvents).values({ name, userId, challengeId, metadata });
}
