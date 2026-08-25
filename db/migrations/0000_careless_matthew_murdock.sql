CREATE TYPE "public"."age_band" AS ENUM('13_15', '16_17', '18_24', '25_34', '35_PLUS');--> statement-breakpoint
CREATE TYPE "public"."challenge_state" AS ENUM('DRAFT', 'UPCOMING', 'OPEN', 'SUBMISSION_CLOSED', 'REVEAL_LIVE', 'VOTING_CLOSED', 'SETTLED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."conversation_state" AS ENUM('REQUESTED', 'ACTIVE', 'DECLINED', 'MUTED', 'BLOCKED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."entry_status" AS ENUM('DRAFT', 'UPLOADING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('TEXT', 'CHALLENGE_SHARE', 'PROOF_SHARE', 'TEAM_INVITATION', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REMOVED');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."team_member_status" AS ENUM('INVITED', 'ACTIVE', 'DECLINED', 'LEFT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'MODERATOR', 'ADMIN');--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"name" varchar(80) NOT NULL,
	"challenge_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"session_hash" varchar(128),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocks" (
	"blocker_id" uuid NOT NULL,
	"blocked_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocks_blocker_id_blocked_id_pk" PRIMARY KEY("blocker_id","blocked_id")
);
--> statement-breakpoint
CREATE TABLE "challenge_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "challenge_skills" (
	"challenge_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "challenge_skills_challenge_id_skill_id_pk" PRIMARY KEY("challenge_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"slug" varchar(120) NOT NULL,
	"title" varchar(180) NOT NULL,
	"brief" text NOT NULL,
	"description" text NOT NULL,
	"state" "challenge_state" DEFAULT 'DRAFT' NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"submission_closes_at" timestamp with time zone NOT NULL,
	"reveal_opens_at" timestamp with time zone NOT NULL,
	"voting_closes_at" timestamp with time zone NOT NULL,
	"settles_at" timestamp with time zone NOT NULL,
	"max_duration_seconds" integer NOT NULL,
	"max_bytes" integer NOT NULL,
	"accepted_mime_types" jsonb NOT NULL,
	"judging_dimensions" jsonb NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"cover_key" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "connection_permissions" (
	"from_user_id" uuid NOT NULL,
	"to_user_id" uuid NOT NULL,
	"connected" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connection_permissions_from_user_id_to_user_id_pk" PRIMARY KEY("from_user_id","to_user_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_mutes" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"muted_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_mutes_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_participants" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "conversation_participants_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state" "conversation_state" NOT NULL,
	"context_type" varchar(30),
	"context_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "deep_link_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"kind" varchar(30) NOT NULL,
	"target_id" uuid NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"opened_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"team_id" uuid,
	"media_asset_id" uuid,
	"caption" varchar(200) DEFAULT '' NOT NULL,
	"status" "entry_status" DEFAULT 'DRAFT' NOT NULL,
	"moderation_status" "moderation_status" DEFAULT 'PENDING' NOT NULL,
	"ai_media_disclosed" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"locked_at" timestamp with time zone,
	"idempotency_key" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"bytes" integer NOT NULL,
	"duration_seconds" real,
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "message_reactions" (
	"message_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction" varchar(24) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_reactions_message_id_user_id_reaction_pk" PRIMARY KEY("message_id","user_id","reaction")
);
--> statement-breakpoint
CREATE TABLE "message_read_state" (
	"conversation_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_read_message_id" uuid,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "message_read_state_conversation_id_user_id_pk" PRIMARY KEY("conversation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "message_requests" (
	"conversation_id" uuid PRIMARY KEY NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"type" "message_type" DEFAULT 'TEXT' NOT NULL,
	"body" varchar(1500),
	"reference_id" uuid,
	"reply_to_id" uuid,
	"client_idempotency_key" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"subject_type" varchar(30) NOT NULL,
	"subject_id" uuid NOT NULL,
	"action" varchar(60) NOT NULL,
	"rationale" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "normalized_results" (
	"entry_id" uuid PRIMARY KEY NOT NULL,
	"challenge_id" uuid NOT NULL,
	"originality" real NOT NULL,
	"execution" real NOT NULL,
	"entertainment" real NOT NULL,
	"normalized_score" real NOT NULL,
	"eligible_vote_count" integer NOT NULL,
	"community_pick" boolean DEFAULT false NOT NULL,
	"judge_pick" boolean DEFAULT false NOT NULL,
	"settled_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profile_proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"challenge_id" uuid NOT NULL,
	"role" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"handle" varchar(30) NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"bio" varchar(240) DEFAULT '' NOT NULL,
	"avatar_key" text,
	"contact_setting" varchar(30) DEFAULT 'SHARED_CONTEXT' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"subject_type" varchar(30) NOT NULL,
	"subject_id" uuid NOT NULL,
	"reason" varchar(80) NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'OPEN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"inviter_id" uuid NOT NULL,
	"invitee_id" uuid,
	"requested_role" varchar(50) NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) NOT NULL,
	"status" "team_member_status" DEFAULT 'INVITED' NOT NULL,
	"joined_at" timestamp with time zone,
	CONSTRAINT "team_members_team_id_user_id_pk" PRIMARY KEY("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"frozen_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "terms_acceptances" (
	"user_id" uuid NOT NULL,
	"terms_version_id" uuid NOT NULL,
	"challenge_id" uuid,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "terms_acceptances_user_id_terms_version_id_pk" PRIMARY KEY("user_id","terms_version_id")
);
--> statement-breakpoint
CREATE TABLE "terms_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(40) NOT NULL,
	"version" varchar(20) NOT NULL,
	"readable_text" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_interests" (
	"user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "user_interests_user_id_skill_id_pk" PRIMARY KEY("user_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"age_band" "age_band" NOT NULL,
	"messaging_pilot_enabled" boolean DEFAULT false NOT NULL,
	"penalty_level" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"originality" integer NOT NULL,
	"execution" integer NOT NULL,
	"entertainment" integer NOT NULL,
	"locked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"device_signal_hash" varchar(128),
	"elapsed_ms" integer
);
--> statement-breakpoint
CREATE TABLE "voting_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"challenge_id" uuid NOT NULL,
	"voter_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"skipped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocker_id_users_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_blocked_id_users_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_rules" ADD CONSTRAINT "challenge_rules_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_skills" ADD CONSTRAINT "challenge_skills_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenge_skills" ADD CONSTRAINT "challenge_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_permissions" ADD CONSTRAINT "connection_permissions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_permissions" ADD CONSTRAINT "connection_permissions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_mutes" ADD CONSTRAINT "conversation_mutes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_mutes" ADD CONSTRAINT "conversation_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deep_link_invitations" ADD CONSTRAINT "deep_link_invitations_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read_state" ADD CONSTRAINT "message_read_state_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_read_state" ADD CONSTRAINT "message_read_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_requests" ADD CONSTRAINT "message_requests_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_requests" ADD CONSTRAINT "message_requests_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_requests" ADD CONSTRAINT "message_requests_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_results" ADD CONSTRAINT "normalized_results_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "normalized_results" ADD CONSTRAINT "normalized_results_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_proofs" ADD CONSTRAINT "profile_proofs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_proofs" ADD CONSTRAINT "profile_proofs_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_proofs" ADD CONSTRAINT "profile_proofs_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invitee_id_users_id_fk" FOREIGN KEY ("invitee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_terms_version_id_terms_versions_id_fk" FOREIGN KEY ("terms_version_id") REFERENCES "public"."terms_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terms_acceptances" ADD CONSTRAINT "terms_acceptances_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_interests" ADD CONSTRAINT "user_interests_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_assignment_id_voting_assignments_id_fk" FOREIGN KEY ("assignment_id") REFERENCES "public"."voting_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_assignments" ADD CONSTRAINT "voting_assignments_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_assignments" ADD CONSTRAINT "voting_assignments_voter_id_users_id_fk" FOREIGN KEY ("voter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voting_assignments" ADD CONSTRAINT "voting_assignments_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_funnel_idx" ON "analytics_events" USING btree ("name","challenge_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "challenge_rule_position_uq" ON "challenge_rules" USING btree ("challenge_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "challenges_number_uq" ON "challenges" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "challenges_slug_uq" ON "challenges" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "challenges_state_dates_idx" ON "challenges" USING btree ("state","submission_closes_at");--> statement-breakpoint
CREATE INDEX "conversation_membership_idx" ON "conversation_participants" USING btree ("user_id","conversation_id");--> statement-breakpoint
CREATE INDEX "conversations_updated_idx" ON "conversations" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "deep_link_token_uq" ON "deep_link_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_creator_challenge_uq" ON "entries" USING btree ("creator_id","challenge_id");--> statement-breakpoint
CREATE UNIQUE INDEX "entry_submit_idempotency_uq" ON "entries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "entries_challenge_status_idx" ON "entries" USING btree ("challenge_id","status","moderation_status");--> statement-breakpoint
CREATE UNIQUE INDEX "media_object_key_uq" ON "media_assets" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "message_request_pair_uq" ON "message_requests" USING btree ("sender_id","recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_sender_idempotency_uq" ON "messages" USING btree ("sender_id","client_idempotency_key");--> statement-breakpoint
CREATE INDEX "messages_cursor_idx" ON "messages" USING btree ("conversation_id","created_at","id");--> statement-breakpoint
CREATE INDEX "results_challenge_score_idx" ON "normalized_results" USING btree ("challenge_id","normalized_score");--> statement-breakpoint
CREATE UNIQUE INDEX "proof_user_entry_uq" ON "profile_proofs" USING btree ("user_id","entry_id");--> statement-breakpoint
CREATE INDEX "proof_user_created_idx" ON "profile_proofs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_handle_uq" ON "user_profiles" USING btree ("handle");--> statement-breakpoint
CREATE INDEX "reports_status_created_idx" ON "reports" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invite_token_uq" ON "team_invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "team_members_user_idx" ON "team_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "terms_kind_version_uq" ON "terms_versions" USING btree ("kind","version");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_assignment_uq" ON "votes" USING btree ("assignment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_voter_entry_uq" ON "votes" USING btree ("voter_id","entry_id");--> statement-breakpoint
CREATE INDEX "votes_entry_idx" ON "votes" USING btree ("entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_voter_entry_uq" ON "voting_assignments" USING btree ("voter_id","entry_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_voter_position_uq" ON "voting_assignments" USING btree ("challenge_id","voter_id","position");--> statement-breakpoint
CREATE INDEX "assignment_balance_idx" ON "voting_assignments" USING btree ("challenge_id","entry_id");