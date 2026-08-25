import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/server/db";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json({ status: "ok", database: "reachable" }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ status: "degraded", database: "unreachable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
