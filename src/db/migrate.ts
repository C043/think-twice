import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export async function runMigrations() {
  console.log("Checking and applying new database migrations...");
  try {
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Database updated successfully");
  } catch (err) {
    console.error("Error during database migration:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}
