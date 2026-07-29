import { objectsTable } from "@/db/schema";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import test, { afterEach, beforeEach, describe } from "node:test";
import { checkReviewsJob, notificationService } from "./scheduled-worker";
import assert from "node:assert";
import { randomUUID } from "node:crypto";

describe("Scheduled Worker Integration Feature", () => {
  let pg: PGlite;
  let db: any;
  let sentMessages: string[];

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    sentMessages = [];

    notificationService.registerProvider({
      id: "mock-provider",
      send: async (message: string) => {
        sentMessages.push(message);
        return true;
      },
    });
  });

  afterEach(async () => {
    await pg.close();
    (notificationService as any).providers = [];
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

  test("should notify every registered provider with the object name", async () => {
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 5);

    await db.insert(objectsTable).values({
      id: randomUUID(),
      name: "Mechanical Keyboard",
      price: 12000,
      createdAt: pastDate,
      reviewAt: pastDate,
      notified: false,
    });

    await checkReviewsJob(db);

    assert.strictEqual(sentMessages.length, 1);
    assert.ok(
      sentMessages[0].includes("Mechanical Keyboard"),
      "The notification body must name the object under review",
    );
  });

  test("should not notify twice for an object already flagged as notified", async () => {
    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 5);

    await db.insert(objectsTable).values({
      id: randomUUID(),
      name: "Already Reviewed",
      price: 5000,
      createdAt: pastDate,
      reviewAt: pastDate,
      notified: true,
    });

    await checkReviewsJob(db);

    assert.strictEqual(sentMessages.length, 0);
  });

  test("should keep the object pending when every provider fails", async () => {
    (notificationService as any).providers = [
      { id: "failing-provider", send: async () => false },
    ];

    const pastDate = new Date();
    pastDate.setMinutes(pastDate.getMinutes() - 5);

    const objectId = randomUUID();

    await db.insert(objectsTable).values({
      id: objectId,
      name: "Unreachable Device",
      price: 9900,
      createdAt: pastDate,
      reviewAt: pastDate,
      notified: false,
    });

    await checkReviewsJob(db);

    const rows = await db.select().from(objectsTable);
    assert.strictEqual(
      rows[0].notified,
      false,
      "A failed delivery must be retried on the next run",
    );
  });
});
