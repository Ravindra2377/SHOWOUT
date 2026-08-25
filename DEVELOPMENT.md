# SHOWOUT implementation plan

## Backend milestone — durable participant loop

1. Make PostgreSQL/Drizzle the runtime source of truth and provide a reproducible local database with intentional seed accounts.
2. Add opaque database sessions that work as secure web cookies and Expo bearer tokens; keep local account selection development-only.
3. Persist upload intents, media validation, idempotent hidden submissions, terms acceptance, balanced Reveal assignments, immutable votes, analytics, settled results, and Proof records.
4. Connect the Expo Arcade, Create, Watch, and Profile surfaces through one typed API client with explicit loading, retry, and server-error states.
5. Verify restart persistence, pre-Reveal media protection, identity omission, self/team/duplicate vote rejection, lifecycle boundaries, and production builds.

Local pilot infrastructure is PostgreSQL plus filesystem-backed development media. S3-compatible storage remains the production adapter; no external service is deployed by this milestone.

## Product decisions

- The pilot is a mobile-first Next.js PWA with a compact desktop shell. The UI uses an editorial paper/red/ink/lime/cobalt system rather than a social-feed visual language.
- Authentication is accessed through a small `AuthAdapter`. The pilot uses a signed, HTTP-only local session in development; production can replace it with magic-link/OTP without changing authorization call sites.
- PostgreSQL and Drizzle are the source-of-truth production model. Seeded pilot data also powers a no-configuration demo adapter so researchers can run the interface immediately.
- Uploads use an `ObjectStorageAdapter`: local development issues same-origin upload intents while the production contract supports S3-compatible presigned URLs. Large media is never posted through a Server Action.
- Server lifecycle checks derive challenge state from stored timestamps and server time. UI clocks are display-only.
- Messaging is controlled: shared challenges, teams, mutual connections, accepted requests, or an admin pilot grant are required. Requests allow exactly one introduction until accepted.
- Creator identity is omitted—not merely hidden with CSS—from reveal assignment payloads until an immutable vote is locked.
- Demo videos use remote sample URLs. A production deployment must configure its own licensed media bucket.

## Delivery plan

1. Establish strict Next.js/TypeScript, PWA metadata, design tokens, shell, adapters, Drizzle schema/migration, and intentional pilot data.
2. Build onboarding/login, Arcade, challenge detail, upload/submit, anonymous Reveal/voting, Results, Proof profile, and Stage.
3. Build challenge teams, deep-link invitation, controlled Inbox/conversations, messaging preferences, settings, and protected pilot admin.
4. Add server APIs and domain rules for lifecycle, reveal privacy, voting integrity, submission idempotency, messaging eligibility, blocking/reporting, analytics, and rate limits.
5. Add unit/integration tests and Playwright journeys; run lint, type-check, tests, and production build.
6. Inspect principal screens at ~390 px and desktop widths, fix layout/accessibility issues, and capture screenshots.

## Pilot limitations

- The interface can still render intentional demo content when the API is offline, but all completed pilot actions use PostgreSQL and survive application restarts.
- Media duration is validated in-browser before upload and re-validated asynchronously in production storage processing; the local demo adapter simulates the direct-upload lifecycle.
- Email delivery, object storage credentials, and production rate-limit infrastructure are adapters and require operator-provided services.
