import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

const connectionString = process.env.DATABASE_URL ?? "postgres://showout:showout@localhost:5433/showout";
const globalDb = globalThis as typeof globalThis & { __showoutSql?: ReturnType<typeof postgres> };
const sql = globalDb.__showoutSql ?? postgres(connectionString, {
  max: process.env.NODE_ENV === "production" ? 10 : 3,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
});
if (process.env.NODE_ENV !== "production") globalDb.__showoutSql = sql;

export const db = drizzle(sql, { schema });
export type ShowoutDb = typeof db;
