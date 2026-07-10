import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { startScheduledWorker } from "@/lib/scheduled-worker";

export type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;

const globalForDrizzle = globalThis as unknown as {
  pool: Pool | undefined;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

if (process.env.NODE_ENV !== "production") {
  globalForDrizzle.pool = pool;
}

export const db = drizzle(pool, { schema });
