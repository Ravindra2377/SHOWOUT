# SHOWOUT - Development Summary

**Project**: SHOWOUT - A creative challenge platform
**Version**: Pilot 01
**Built with**: Next.js 16, Drizzle ORM, PostgreSQL, Expo (React Native)

---

## Project Overview

SHOWOUT is a mobile-first challenge platform where creators participate under shared constraints, vote on work before identity is revealed, and build profiles from settled "proof." The platform is designed around these core principles:

1. **Shared Constraints** - All participants work under the same brief, rules, and media limits
2. **Anonymous Before Identity** - Work is evaluated on merit before creator identity is revealed
3. **Profile from Proof** - Users build reputations from their approved/settled entries
4. **Mobile-First** - Designed primarily for mobile experience with responsive web layout
5. **Pilot/Experimental** - Current version is "Pilot 01" with intentional limitations for testing and feedback

---

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (app router)
- **ORM**: Drizzle ORM with PostgreSQL
- **Mobile**: Expo (React Native 0.81.5)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Deployment**: Render.com (Node web service + PostgreSQL)

### Key Directories

| Directory | Description |
|---|---|
| `app/` | Next.js 16 app router with ~20 route groups |
| `apps/expo/` | Expo native mobile app |
| `components/` | React UI components |
| `lib/domain/` | Business logic (lifecycle, messaging, reveal, scoring) |
| `lib/server/` | Server-side services (auth, storage, analytics) |
| `db/` | Drizzle ORM schema and migrations |
| `tests/` | Vitest unit tests |
| `e2e/` | Playwright e2e tests |
| `scripts/` | Database seeder |
| `public/` | Static assets |

---

## Features Built

### A. Challenge Platform

- **Challenge states**: DRAFT → UPCOMING → OPEN → SUBMISSION_CLOSED → REVEAL_LIVE → VOTING_CLOSED → SETTLED → ARCHIVED
- **Lifecycle logic** in `lib/domain/lifecycle.ts` with exact half-open deadline boundaries
- **Runtime challenge data** including rules, judging dimensions, skills, media limits (duration + size)
- **5 pilot challenges** in `lib/demo-data.ts` spanning different states

### B. Entry Submission System

- Video entries (MP4, WebM, MOV) with constraint validation
- Direct uploads via presigned URLs (local or S3 adapter in `lib/server/storage.ts`)
- Entry statuses: DRAFT → UPLOADING → SUBMITTED → APPROVED/REJECTED/REMOVED
- AI media disclosure required when applicable
- Idempotency keys to prevent duplicate submissions

### C. Voting System

- **Anonymous voting** during REVEAL_LIVE state
- Scoring on 3 dimensions: originality, execution, entertainment (1-5)
- **Normalized scoring** with Bayesian shrinkage toward neutral prior (score of 3 with minimum 3 votes)
- Team-aware voting (cannot vote for own team entries)
- Vote locking after scoring

### D. Reveal Flow

- Creator identity hidden until after vote is locked
- `lib/domain/reveal.anonymousRevealPayload()` strips creator from payload
- `mayVote()` rejects self-voting, team voting, and duplicate voting
- After lock: creator identity revealed (Maya Sen profile shown)

### E. User Profiles & Proof

- Profiles with handle, display name, bio, avatar
- **Skills** earned through challenge participation
- **Profile proofs** - approved entries that contribute to a user's profile
- Community picks and judge picks marked on proofs
- Profile stats: challenges entered, community picks, judge picks, completion rate

### F. Messaging & Communication

- **Controlled eligibility** in `lib/domain/messaging.ts`:
  - ACTIVE: shared challenge, shared team, mutual connection, accepted request, pilot enabled
  - REQUEST: no prior context
  - DENIED: blocked, prior decline, or adult-to-minor without approved context
- **Inbox** with messages, team conversations, and message requests
- Block/report functionality

### G. Teams

- Team formation within challenges
- Team members with roles (INVITED/ACTIVE/DECLINED/LEFT)
- Team invitations with token hashes
- Team conversations in inbox
- Frozen team state at certain lifecycle points

### H. Admin/Control Room (operator-only)

- `requireAdmin` middleware protects admin routes
- Pilot funnel metrics (entered→submitted, submitted→reveal, invited someone, second challenge, started another round)
- Operator queue: entries awaiting review, open safety reports, vote integrity signals
- Challenge lifecycle management from control room

### I. Analytics

- 27 allowed event names (onboarding_completed, challenge_viewed, challenge_entered, etc.)
- Privacy-safe: no body/message/text/content in metadata
- Dual storage: in-memory store (`lib/server/store.ts`) and PostgreSQL (`lib/server/analytics-db.ts`)

### J. Expo Native App

- React Native 0.81.5 with expo-linear-gradient, expo-image-picker, expo-secure-store
- Camera/video capture integration
- Designed to work with the web backend via `api.ts`
- `WebCompanion.tsx` for web bridge functionality

---

## Database Schema

- **~30+ tables** with 100+ columns total
- Core tables: users, challenges, entries, media, votes, proofs, teams, team_invitations, messages, message_requests, blocks, reports, skills, profile_picks
- Drizzle ORM schema in `db/` directory
- 3 SQL migration files

---

## API Routes (app/)

Key route groups:

- `challenge/` - Challenge detail, entries, voting
- `admin/` - Operator control room, pilot metrics
- `stage/` - Entry submission flow
- `reveal/` - Reveal flow
- `results/` - Voting results
- `inbox/` - Messaging
- `u/[handle]/` - User profile pages
- `team/` - Team management

---

## Tests

- **Vitest unit tests** in `tests/` covering: auth, lifecycle, scoring, messaging, reveal
- **Playwright e2e tests** in `e2e/` covering: participant flow, reveal anonymity, messaging, admin access
- Test pilot accounts: Maya (`maya@showout.test`), Niko voter (`niko@showout.test`), Admin (`pilot.admin@showout.test`)

---

## Pilot Accounts

| Role | Email | Key |
|---|---|---|
| Creator (Maya) | maya@showout.test | maya |
| Voter | niko@showout.test | voter |
| Operator (Admin) | pilot.admin@showout.test | admin |

---

## Deployment

- **Render.com** configuration in `render.yaml`
- Auto-seed on deploy via database seeder script
- Environment variables in `.env.example`:
  - DATABASE_URL
  - AUTH_SECRET
  - S3 settings (local adapter or S3)
  - Pilot configuration flags

---

## Known Limitations (Pilot 01)

- Ephemeral filesystem (no persistent storage between restarts unless configured with S3)
- Limited pilot access codes (invite-only)
- Demo data only (5 creators, 5 challenges)
- No production authentication (dev-only keys)

---

## Inbox / DM Feature Plan

**Feature**: 1:1 messaging with request-gating, built on existing eligibility logic
**Status**: Implemented (UI & Backend Complete)
**Scope note**: This is a gated "Connect" flow, not open DMs. It reuses the ACTIVE / REQUEST / DENIED eligibility already defined in `lib/domain/messaging.ts`, consistent with the platform's "Social by Making" principle (no unrestricted stranger messaging).

### 1. Implemented Components

| Piece | Status | Location |
|---|---|---|
| Eligibility logic (ACTIVE / REQUEST / DENIED) | ✅ Built | `lib/domain/messaging.ts` |
| `messages`, `message_requests` tables | ✅ Built | `db/` schema |
| Block / report handling | ✅ Built | messaging domain logic |
| Team conversations in inbox | ✅ Built | inbox backend |
| Inbox UI (list of threads) | ✅ Built | `app/inbox/page.tsx`, `apps/expo/NativeShowout.tsx` |
| Thread/chat UI | ✅ Built | `components/conversation.tsx`, `app/messages/[conversationId]/page.tsx` |
| Accept/decline UI for requests | ✅ Built | `app/inbox/requests/page.tsx` |
| "Message" entry point on profile/team pages | ✅ Built | `app/u/[handle]/page.tsx` |

### 2. Built Screens & Workflows

#### A. Inbox (list view)
- Web Route: `app/inbox/page.tsx` & Expo App: `apps/expo/NativeShowout.tsx`
- Three tabs: **Chats** (ACTIVE threads), **Requests** (pending REQUEST-state threads), and **Teams** (team conversations)
- Each row displays avatar, handle/name, preview, time, and unread indicators.

#### B. Thread / Chat view
- Route: `app/messages/[conversationId]/page.tsx` & `components/conversation.tsx`
- Eligibility-gated message composer and message history.

#### C. Accept/Decline flow
- Route: `app/inbox/requests/page.tsx`
- Provides Accept / Decline / Block / Report actions, mapping into `lib/domain/messaging.ts`.

#### D. Entry points
- Profile page `app/u/[handle]/page.tsx` features an ACTIVE/REQUEST/DENIED gated Message button.

---

### 3. Open Decisions (Pending Confirmation)

- [ ] Do team conversations live in the same inbox list as 1:1 chats, or a separate tab? *(Currently built as a separate tab)*
- [ ] What does a REQUEST thread show before acceptance — first message only, or nothing until accepted?
- [ ] Polling interval vs. websockets — confirm polling is acceptable for pilot scale.
- [ ] Shared vs. separate message-list component for 1:1 vs. team threads.

---

### 4. Guardrail Reminder

This feature is a **gated connect flow**, not open messaging. Per the original product principles:
- No unrestricted stranger DMs — every new thread starts as a REQUEST unless prior context exists (shared challenge, shared team, mutual connection).
- Blocked/declined/minor-restricted paths must be visually enforced in the UI, not just backend-correct.
- Any future "open inbox to anyone" change should be treated as a scope decision, not a bug fix.