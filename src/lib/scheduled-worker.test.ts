import { objectsTable } from "@/db/schema";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import test, { afterEach, beforeEach, describe } from "node:test";
import { checkReviewsJob } from "./scheduled-worker";
import assert from "node:assert";
import { randomUUID } from "node:crypto";

describe("Scheduled Worker Integration Feature", () => {
  let pg: PGlite;
  let db: any;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should process expired objects using PGlite", async () => {
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 5);

    const validUuid = randomUUID();

    await db.insert(objectsTable).values({
      id: validUuid,
      name: "Test Monitor",
      price: 30000,
      createdAt: pastDate,
      reviewAt: pastDate,
      notified: false,
    });

    const processedCount = await checkReviewsJob(db);

    assert.strictEqual(processedCount, 1);

    const rows = await db.select().from(objectsTable);
    assert.strictEqual(rows[0].notified, true);
  });
});
