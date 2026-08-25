-- SHOWOUT pilot foundation. Generated from db/schema.ts; UUID support is native on PostgreSQL 13+.
CREATE TYPE age_band AS ENUM ('13_15','16_17','18_24','25_34','35_PLUS');
CREATE TYPE user_role AS ENUM ('USER','MODERATOR','ADMIN');
CREATE TYPE challenge_state AS ENUM ('DRAFT','UPCOMING','OPEN','SUBMISSION_CLOSED','REVEAL_LIVE','VOTING_CLOSED','SETTLED','ARCHIVED');
CREATE TYPE entry_status AS ENUM ('DRAFT','UPLOADING','SUBMITTED','APPROVED','REJECTED','REMOVED');
CREATE TYPE moderation_status AS ENUM ('PENDING','APPROVED','REJECTED','REMOVED');
CREATE TYPE team_member_status AS ENUM ('INVITED','ACTIVE','DECLINED','LEFT');
CREATE TYPE report_status AS ENUM ('OPEN','REVIEWING','RESOLVED','DISMISSED');
CREATE TYPE conversation_state AS ENUM ('REQUESTED','ACTIVE','DECLINED','MUTED','BLOCKED','CLOSED');
CREATE TYPE message_type AS ENUM ('TEXT','CHALLENGE_SHARE','PROOF_SHARE','TEAM_INVITATION','SYSTEM');
CREATE TYPE invitation_status AS ENUM ('PENDING','ACCEPTED','DECLINED','REVOKED','EXPIRED');
-- The executable migration is maintained by `npm run db:generate`; this marker pins the audited model version.
-- Run db:generate after configuring DATABASE_URL, then review the emitted statements before db:migrate.
