import "server-only";
import { cookies } from "next/headers";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { authSessions, profiles, users } from "@/db/schema";
import { db } from "@/lib/server/db";

export type SessionUser = {
  id: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  ageBand: "13_15" | "16_17" | "18_24" | "25_34" | "35_PLUS";
  handle: string;
  displayName: string;
};

const legacyUsers: Record<string, SessionUser> = {
  maya: { id: "11111111-1111-4111-8111-111111111111", email: "maya@showout.test", role: "USER", ageBand: "18_24", handle: "maya.makes", displayName: "Maya Sen" },
  admin: { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", email: "pilot.admin@showout.test", role: "ADMIN", ageBand: "25_34", handle: "pilot.operator", displayName: "Pilot Operator" },
};
const secret = () => process.env.AUTH_SECRET ?? (process.env.NODE_ENV !== "production" ? "showout-local-development-secret-only" : "");
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

// Kept for deterministic unit tests and migration compatibility; new logins use opaque DB sessions.
export function createSessionValue(key: string) {
  const payload = Buffer.from(key).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
export function parseSessionValue(value?: string): SessionUser | null {
  if (!value || !secret()) return null;
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest();
  let received: Buffer;
  try { received = Buffer.from(sig, "base64url"); } catch { return null; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  return legacyUsers[Buffer.from(payload, "base64url").toString()] ?? null;
}

export async function createDatabaseSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(authSessions).values({ userId, tokenHash: tokenHash(token), expiresAt });
  return { token, expiresAt };
}

async function userForToken(token: string): Promise<SessionUser | null> {
  const rows = await db.select({
    id: users.id, email: users.email, role: users.role, ageBand: users.ageBand,
    handle: profiles.handle, displayName: profiles.displayName,
  }).from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .innerJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(authSessions.tokenHash, tokenHash(token)), gt(authSessions.expiresAt, new Date()), isNull(authSessions.revokedAt), isNull(users.deletedAt)))
    .limit(1);
  return rows[0] ?? null;
}

export async function currentUser(request?: Request): Promise<SessionUser | null> {
  const authorization = request?.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
  const jar = bearer ? null : await cookies();
  const opaque = bearer ?? jar?.get("showout_token")?.value;
  if (opaque) return userForToken(opaque);
  return parseSessionValue(jar?.get("showout_session")?.value);
}
export async function requireUser(request?: Request) { const user = await currentUser(request); if (!user) redirect("/login"); return user; }
export async function requireAdmin(request?: Request) { const user = await requireUser(request); if (user.role !== "ADMIN") redirect("/arcade?error=admin_required"); return user; }
export interface AuthAdapter { getUser(request?: Request): Promise<SessionUser | null>; requireUser(request?: Request): Promise<SessionUser>; }
export const authAdapter: AuthAdapter = { getUser: currentUser, requireUser };
