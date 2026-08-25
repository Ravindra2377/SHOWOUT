import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { profiles, users } from "@/db/schema";
import { createDatabaseSession } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

const accounts: Record<string, string> = {
  maya: "maya.makes",
  voter: "niko.cut",
  admin: "pilot.operator",
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    if (process.env.PILOT_LOGIN_ENABLED !== "true") return NextResponse.json({ error: "Pilot login is disabled" }, { status: 404 });
    const expected = process.env.PILOT_ACCESS_CODE ?? "";
    const supplied = request.headers.get("x-showout-pilot-code") ?? "";
    const expectedHash = createHash("sha256").update(expected).digest();
    const suppliedHash = createHash("sha256").update(supplied).digest();
    if (expected.length < 8 || !timingSafeEqual(expectedHash, suppliedHash)) return NextResponse.json({ error: "Invalid pilot access code" }, { status: 401 });
  }
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 10, 60_000).allowed) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const body = await request.json().catch(() => ({})) as { account?: string };
  const account = body.account && accounts[body.account] ? body.account : "maya";
  const rows = await db.select({ id: users.id, email: users.email, role: users.role, ageBand: users.ageBand, handle: profiles.handle, displayName: profiles.displayName })
    .from(users).innerJoin(profiles, eq(profiles.userId, users.id)).where(eq(profiles.handle, accounts[account]!)).limit(1);
  const user = rows[0];
  if (!user) return NextResponse.json({ error: "Seed account not found. Run npm run seed." }, { status: 503 });
  const session = await createDatabaseSession(user.id);
  const response = NextResponse.json({ token: session.token, expiresAt: session.expiresAt.toISOString(), user, redirect: user.role === "ADMIN" ? "/admin" : "/arcade" });
  response.cookies.set("showout_token", session.token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: session.expiresAt });
  return response;
}
