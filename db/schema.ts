import {
  pgEnum, pgTable, uuid, varchar, text, timestamp, integer, boolean, jsonb,
  primaryKey, uniqueIndex, index, real,
} from "drizzle-orm/pg-core";

export const ageBand = pgEnum("age_band", ["13_15", "16_17", "18_24", "25_34", "35_PLUS"]);
export const userRole = pgEnum("user_role", ["USER", "MODERATOR", "ADMIN"]);
export const challengeState = pgEnum("challenge_state", ["DRAFT", "UPCOMING", "OPEN", "SUBMISSION_CLOSED", "REVEAL_LIVE", "VOTING_CLOSED", "SETTLED", "ARCHIVED"]);
export const entryStatus = pgEnum("entry_status", ["DRAFT", "UPLOADING", "SUBMITTED", "APPROVED", "REJECTED", "REMOVED"]);
export const moderationStatus = pgEnum("moderation_status", ["PENDING", "APPROVED", "REJECTED", "REMOVED"]);
export const teamMemberStatus = pgEnum("team_member_status", ["INVITED", "ACTIVE", "DECLINED", "LEFT"]);
export const reportStatus = pgEnum("report_status", ["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"]);
export const conversationState = pgEnum("conversation_state", ["REQUESTED", "ACTIVE", "DECLINED", "MUTED", "BLOCKED", "CLOSED"]);
export const messageType = pgEnum("message_type", ["TEXT", "CHALLENGE_SHARE", "PROOF_SHARE", "TEAM_INVITATION", "SYSTEM"]);
export const invitationStatus = pgEnum("invitation_status", ["PENDING", "ACCEPTED", "DECLINED", "REVOKED", "EXPIRED"]);

const audit = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull(),
  role: userRole("role").notNull().default("USER"),
  ageBand: ageBand("age_band").notNull(),
  messagingPilotEnabled: boolean("messaging_pilot_enabled").notNull().default(false),
  penaltyLevel: integer("penalty_level").notNull().default(0),
  ...audit,
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 64 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (t) => [uniqueIndex("auth_sessions_token_uq").on(t.tokenHash), index("auth_sessions_user_expiry_idx").on(t.userId, t.expiresAt)]);

export const profiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  handle: varchar("handle", { length: 30 }).notNull(),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  bio: varchar("bio", { length: 240 }).notNull().default(""),
  avatarKey: text("avatar_key"),
  contactSetting: varchar("contact_setting", { length: 30 }).notNull().default("SHARED_CONTEXT"),
  ...audit,
}, (t) => [uniqueIndex("profiles_handle_uq").on(t.handle)]);

export const skills = pgTable("skills", { id: uuid("id").primaryKey().defaultRandom(), name: varchar("name", { length: 50 }).notNull().unique() });
export const userInterests = pgTable("user_interests", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  skillId: uuid("skill_id").notNull().references(() => skills.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.userId, t.skillId] })]);

export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").notNull(), slug: varchar("slug", { length: 120 }).notNull(),
  title: varchar("title", { length: 180 }).notNull(), brief: text("brief").notNull(),
  description: text("description").notNull(), state: challengeState("state").notNull().default("DRAFT"),
  opensAt: timestamp("opens_at", { withTimezone: true }).notNull(),
  submissionClosesAt: timestamp("submission_closes_at", { withTimezone: true }).notNull(),
  revealOpensAt: timestamp("reveal_opens_at", { withTimezone: true }).notNull(),
  votingClosesAt: timestamp("voting_closes_at", { withTimezone: true }).notNull(),
  settlesAt: timestamp("settles_at", { withTimezone: true }).notNull(),
  maxDurationSeconds: integer("max_duration_seconds").notNull(),
  maxBytes: integer("max_bytes").notNull(), acceptedMimeTypes: jsonb("accepted_mime_types").$type<string[]>().notNull(),
  judgingDimensions: jsonb("judging_dimensions").$type<string[]>().notNull(), published: boolean("published").notNull().default(false),
  coverKey: text("cover_key"), createdBy: uuid("created_by").notNull().references(() => users.id),
  ...audit,
}, (t) => [uniqueIndex("challenges_number_uq").on(t.number), uniqueIndex("challenges_slug_uq").on(t.slug), index("challenges_state_dates_idx").on(t.state, t.submissionClosesAt)]);

export const challengeRules = pgTable("challenge_rules", { id: uuid("id").primaryKey().defaultRandom(), challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }), position: integer("position").notNull(), text: text("text").notNull() }, (t) => [uniqueIndex("challenge_rule_position_uq").on(t.challengeId, t.position)]);
export const challengeSkills = pgTable("challenge_skills", { challengeId: uuid("challenge_id").notNull().references(() => challenges.id, { onDelete: "cascade" }), skillId: uuid("skill_id").notNull().references(() => skills.id) }, (t) => [primaryKey({ columns: [t.challengeId, t.skillId] })]);

export const teams = pgTable("teams", { id: uuid("id").primaryKey().defaultRandom(), challengeId: uuid("challenge_id").notNull().references(() => challenges.id), name: varchar("name", { length: 80 }).notNull(), frozenAt: timestamp("frozen_at", { withTimezone: true }), createdBy: uuid("created_by").notNull().references(() => users.id), ...audit });
export const teamMembers = pgTable("team_members", { teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id), role: varchar("role", { length: 50 }).notNull(), status: teamMemberStatus("status").notNull().default("INVITED"), joinedAt: timestamp("joined_at", { withTimezone: true }) }, (t) => [primaryKey({ columns: [t.teamId, t.userId] }), index("team_members_user_idx").on(t.userId, t.status)]);
export const teamInvitations = pgTable("team_invitations", { id: uuid("id").primaryKey().defaultRandom(), teamId: uuid("team_id").notNull().references(() => teams.id), inviterId: uuid("inviter_id").notNull().references(() => users.id), inviteeId: uuid("invitee_id").references(() => users.id), requestedRole: varchar("requested_role", { length: 50 }).notNull(), status: invitationStatus("status").notNull().default("PENDING"), tokenHash: varchar("token_hash", { length: 128 }).notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), ...audit }, (t) => [uniqueIndex("team_invite_token_uq").on(t.tokenHash)]);

export const mediaAssets = pgTable("media_assets", { id: uuid("id").primaryKey().defaultRandom(), ownerId: uuid("owner_id").notNull().references(() => users.id), objectKey: text("object_key").notNull(), mimeType: varchar("mime_type", { length: 100 }).notNull(), bytes: integer("bytes").notNull(), durationSeconds: real("duration_seconds"), status: varchar("status", { length: 30 }).notNull().default("PENDING"), ...audit }, (t) => [uniqueIndex("media_object_key_uq").on(t.objectKey)]);
export const entries = pgTable("entries", { id: uuid("id").primaryKey().defaultRandom(), challengeId: uuid("challenge_id").notNull().references(() => challenges.id), creatorId: uuid("creator_id").notNull().references(() => users.id), teamId: uuid("team_id").references(() => teams.id), mediaAssetId: uuid("media_asset_id").references(() => mediaAssets.id), caption: varchar("caption", { length: 200 }).notNull().default(""), status: entryStatus("status").notNull().default("DRAFT"), moderationStatus: moderationStatus("moderation_status").notNull().default("PENDING"), aiMediaDisclosed: boolean("ai_media_disclosed").notNull().default(false), submittedAt: timestamp("submitted_at", { withTimezone: true }), lockedAt: timestamp("locked_at", { withTimezone: true }), idempotencyKey: varchar("idempotency_key", { length: 100 }), ...audit }, (t) => [uniqueIndex("entry_creator_challenge_uq").on(t.creatorId, t.challengeId), uniqueIndex("entry_submit_idempotency_uq").on(t.idempotencyKey), index("entries_challenge_status_idx").on(t.challengeId, t.status, t.moderationStatus)]);

export const votingAssignments = pgTable("voting_assignments", { id: uuid("id").primaryKey().defaultRandom(), challengeId: uuid("challenge_id").notNull().references(() => challenges.id), voterId: uuid("voter_id").notNull().references(() => users.id), entryId: uuid("entry_id").notNull().references(() => entries.id), position: integer("position").notNull(), skippedAt: timestamp("skipped_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [uniqueIndex("assignment_voter_entry_uq").on(t.voterId, t.entryId), uniqueIndex("assignment_voter_position_uq").on(t.challengeId, t.voterId, t.position), index("assignment_balance_idx").on(t.challengeId, t.entryId)]);
export const votes = pgTable("votes", { id: uuid("id").primaryKey().defaultRandom(), assignmentId: uuid("assignment_id").notNull().references(() => votingAssignments.id), voterId: uuid("voter_id").notNull().references(() => users.id), entryId: uuid("entry_id").notNull().references(() => entries.id), originality: integer("originality").notNull(), execution: integer("execution").notNull(), entertainment: integer("entertainment").notNull(), lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(), deviceSignalHash: varchar("device_signal_hash", { length: 128 }), elapsedMs: integer("elapsed_ms") }, (t) => [uniqueIndex("votes_assignment_uq").on(t.assignmentId), uniqueIndex("votes_voter_entry_uq").on(t.voterId, t.entryId), index("votes_entry_idx").on(t.entryId)]);
export const normalizedResults = pgTable("normalized_results", { entryId: uuid("entry_id").primaryKey().references(() => entries.id), challengeId: uuid("challenge_id").notNull().references(() => challenges.id), originality: real("originality").notNull(), execution: real("execution").notNull(), entertainment: real("entertainment").notNull(), normalizedScore: real("normalized_score").notNull(), eligibleVoteCount: integer("eligible_vote_count").notNull(), communityPick: boolean("community_pick").notNull().default(false), judgePick: boolean("judge_pick").notNull().default(false), settledAt: timestamp("settled_at", { withTimezone: true }).notNull() }, (t) => [index("results_challenge_score_idx").on(t.challengeId, t.normalizedScore)]);
export const profileProofs = pgTable("profile_proofs", { id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").notNull().references(() => users.id), entryId: uuid("entry_id").notNull().references(() => entries.id), challengeId: uuid("challenge_id").notNull().references(() => challenges.id), role: varchar("role", { length: 50 }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [uniqueIndex("proof_user_entry_uq").on(t.userId, t.entryId), index("proof_user_created_idx").on(t.userId, t.createdAt)]);

export const blocks = pgTable("blocks", { blockerId: uuid("blocker_id").notNull().references(() => users.id), blockedId: uuid("blocked_id").notNull().references(() => users.id), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [primaryKey({ columns: [t.blockerId, t.blockedId] })]);
export const reports = pgTable("reports", { id: uuid("id").primaryKey().defaultRandom(), reporterId: uuid("reporter_id").notNull().references(() => users.id), subjectType: varchar("subject_type", { length: 30 }).notNull(), subjectId: uuid("subject_id").notNull(), reason: varchar("reason", { length: 80 }).notNull(), details: text("details"), status: reportStatus("status").notNull().default("OPEN"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), resolvedAt: timestamp("resolved_at", { withTimezone: true }) }, (t) => [index("reports_status_created_idx").on(t.status, t.createdAt)]);
export const moderationActions = pgTable("moderation_actions", { id: uuid("id").primaryKey().defaultRandom(), adminId: uuid("admin_id").notNull().references(() => users.id), subjectType: varchar("subject_type", { length: 30 }).notNull(), subjectId: uuid("subject_id").notNull(), action: varchar("action", { length: 60 }).notNull(), rationale: text("rationale").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });

export const conversations = pgTable("conversations", { id: uuid("id").primaryKey().defaultRandom(), state: conversationState("state").notNull(), contextType: varchar("context_type", { length: 30 }), contextId: uuid("context_id"), createdBy: uuid("created_by").notNull().references(() => users.id), ...audit }, (t) => [index("conversations_updated_idx").on(t.updatedAt)]);
export const conversationParticipants = pgTable("conversation_participants", { conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id), joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(), leftAt: timestamp("left_at", { withTimezone: true }) }, (t) => [primaryKey({ columns: [t.conversationId, t.userId] }), index("conversation_membership_idx").on(t.userId, t.conversationId)]);
export const messages = pgTable("messages", { id: uuid("id").primaryKey().defaultRandom(), conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }), senderId: uuid("sender_id").notNull().references(() => users.id), type: messageType("type").notNull().default("TEXT"), body: varchar("body", { length: 1500 }), referenceId: uuid("reference_id"), replyToId: uuid("reply_to_id"), clientIdempotencyKey: varchar("client_idempotency_key", { length: 100 }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), deletedAt: timestamp("deleted_at", { withTimezone: true }) }, (t) => [uniqueIndex("message_sender_idempotency_uq").on(t.senderId, t.clientIdempotencyKey), index("messages_cursor_idx").on(t.conversationId, t.createdAt, t.id)]);
export const messageRequests = pgTable("message_requests", { conversationId: uuid("conversation_id").primaryKey().references(() => conversations.id, { onDelete: "cascade" }), senderId: uuid("sender_id").notNull().references(() => users.id), recipientId: uuid("recipient_id").notNull().references(() => users.id), status: invitationStatus("status").notNull().default("PENDING"), decidedAt: timestamp("decided_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [uniqueIndex("message_request_pair_uq").on(t.senderId, t.recipientId)]);
export const messageReactions = pgTable("message_reactions", { messageId: uuid("message_id").notNull().references(() => messages.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id), reaction: varchar("reaction", { length: 24 }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [primaryKey({ columns: [t.messageId, t.userId, t.reaction] })]);
export const messageReadState = pgTable("message_read_state", { conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id), lastReadMessageId: uuid("last_read_message_id"), readAt: timestamp("read_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [primaryKey({ columns: [t.conversationId, t.userId] })]);
export const conversationMutes = pgTable("conversation_mutes", { conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }), userId: uuid("user_id").notNull().references(() => users.id), mutedUntil: timestamp("muted_until", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [primaryKey({ columns: [t.conversationId, t.userId] })]);
export const connectionPermissions = pgTable("connection_permissions", { fromUserId: uuid("from_user_id").notNull().references(() => users.id), toUserId: uuid("to_user_id").notNull().references(() => users.id), connected: boolean("connected").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [primaryKey({ columns: [t.fromUserId, t.toUserId] })]);

export const termsVersions = pgTable("terms_versions", { id: uuid("id").primaryKey().defaultRandom(), kind: varchar("kind", { length: 40 }).notNull(), version: varchar("version", { length: 20 }).notNull(), readableText: text("readable_text").notNull(), effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull() }, (t) => [uniqueIndex("terms_kind_version_uq").on(t.kind, t.version)]);
export const termsAcceptances = pgTable("terms_acceptances", { userId: uuid("user_id").notNull().references(() => users.id), termsVersionId: uuid("terms_version_id").notNull().references(() => termsVersions.id), challengeId: uuid("challenge_id").references(() => challenges.id), acceptedAt: timestamp("accepted_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [primaryKey({ columns: [t.userId, t.termsVersionId] })]);
export const deepLinkInvitations = pgTable("deep_link_invitations", { id: uuid("id").primaryKey().defaultRandom(), creatorId: uuid("creator_id").notNull().references(() => users.id), kind: varchar("kind", { length: 30 }).notNull(), targetId: uuid("target_id").notNull(), tokenHash: varchar("token_hash", { length: 128 }).notNull(), openedAt: timestamp("opened_at", { withTimezone: true }), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [uniqueIndex("deep_link_token_uq").on(t.tokenHash)]);
export const analyticsEvents = pgTable("analytics_events", { id: uuid("id").primaryKey().defaultRandom(), userId: uuid("user_id").references(() => users.id), name: varchar("name", { length: 80 }).notNull(), challengeId: uuid("challenge_id").references(() => challenges.id), metadata: jsonb("metadata").$type<Record<string, string | number | boolean>>().notNull().default({}), sessionHash: varchar("session_hash", { length: 128 }), occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow() }, (t) => [index("analytics_funnel_idx").on(t.name, t.challengeId, t.occurredAt)]);
