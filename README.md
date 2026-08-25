# SHOWOUT

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com/blueprint/new?repo=https%3A%2F%2Fgithub.com%2FRavindra2377%2FSHOWOUT)

**Don’t scroll. Show out.** A mobile-first challenge platform where creators make under shared constraints, vote before identity is revealed, and build a profile from settled Proof.

## Deploy on Render (no Docker)

The repository includes `render.yaml`, which creates a Node web service and managed Render PostgreSQL database. Render installs dependencies, builds Next.js, applies Drizzle migrations, seeds the first pilot dataset once, and monitors `/api/health`.

1. Push or import this repository in Render as a **Blueprint**.
2. Enter a private `PILOT_ACCESS_CODE` of at least 8 characters when prompted.
3. Set `NEXT_PUBLIC_APP_URL` to your Render URL, for example `https://showout.onrender.com`.
4. Set `EXPO_WEB_ORIGIN` to the exact hosted Expo web origin, or leave it blank when using only Expo native.
5. After Render is live, set `EXPO_PUBLIC_SHOWOUT_URL` in `apps/expo/.env` to the Render URL. For the closed seed-account pilot, also set `EXPO_PUBLIC_PILOT_ACCESS_CODE`.

The free Render filesystem is ephemeral. PostgreSQL data is durable, but development video files can disappear after a restart or deploy. Configure the S3 adapter before collecting irreplaceable participant uploads.

## Local development without Docker

Install or provision any PostgreSQL service, place its connection string in `DATABASE_URL`, then run:

```bash
cp .env.example .env.local
npm install
npm run db:migrate
npm run seed
npm run dev -- --hostname 0.0.0.0 --port 3001
```

Open `http://localhost:3001`. Local media is written to `.data/uploads`.

Start Expo in another terminal:

```bash
cd apps/expo
cp .env.example .env
# Set EXPO_PUBLIC_SHOWOUT_URL=http://YOUR_COMPUTER_LAN_IP:3001
npm install
npm start -- --lan --clear --port 8081
```

Development-only pilot accounts:

- Maya: `maya@showout.test` / account key `maya`
- Reveal voter: `niko@showout.test` / account key `voter`
- Operator: `pilot.admin@showout.test` / account key `admin`

Hosted seed-account access requires the Render pilot code. It is an intentionally limited testing mechanism, not the final public authentication system.

## Validate

```bash
npm test
npm run test:integration
npm run lint
npm run typecheck
npm run build
npm run test:e2e
cd apps/expo
npx tsc --noEmit
npx expo-doctor
npx expo export --platform ios --output-dir dist-backend-connected --clear
```

## Durable services

PostgreSQL/Drizzle is the runtime source of truth. For S3-compatible direct uploads, set `STORAGE_ADAPTER=s3` and the `S3_*` variables in `.env.example`. Production also requires a strong `AUTH_SECRET`, HTTPS, an OTP/magic-link provider, and an exact `EXPO_WEB_ORIGIN` if Expo web is hosted separately.

Architecture, product decisions, and current pilot limitations are documented in `DEVELOPMENT.md`.
