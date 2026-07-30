// Set before anything else in this file: V8 reads process.env.TZ lazily, and
// `node --test` runs each test file in its own process, so this stays isolated.
//
// A non-UTC zone is the whole point. `timestamp without time zone` stores a wall
// clock, so the bug it hides is invisible when the process and the database
// agree on UTC — which is exactly the case in the Docker containers, and the
// reason this went unnoticed. On the host, `npm run dev` runs in local time.
process.env.TZ = "Europe/Rome";

import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { objectsTable, pushSubscriptionsTable } from "@/db/schema";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";
import { AddObjectUseCase } from "@/use-cases/add-object";
import { progressPercentage } from "@/lib/object-format";
import type { PgliteDatabase } from "drizzle-orm/pglite";

/** Generous enough for a pglite round trip, tight enough to catch an offset. */
const SLACK_MS = 5000;

describe("Timestamp round trips", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let objectRepository: DrizzleObjectRepository;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    objectRepository = new DrizzleObjectRepository(db);
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should read back a database-assigned created_at as the current instant", async () => {
    const before = Date.now();

    const created = await objectRepository.create({
      name: "Nintendo Switch",
      price: 30000,
      reviewAt: new Date("2026-08-29T10:00:00Z"),
    });

    const drift = created.createdAt.getTime() - before;

    assert.ok(
      Math.abs(drift) < SLACK_MS,
      `created_at is off by ${Math.round(drift / 1000)}s, which is a timezone offset rather than latency`,
    );
  });

  test("should preserve an application-written instant exactly", async () => {
    const reviewAt = new Date("2026-08-29T10:00:00Z");

    const created = await objectRepository.create({
      name: "Pocket Operator",
      price: 10000,
      reviewAt,
    });

    assert.strictEqual(
      created.reviewAt.getTime(),
      reviewAt.getTime(),
      "review_at must survive the round trip unshifted",
    );
  });

  test("should keep created_at and review_at on the same scale", async () => {
    // The wait is what the whole product is about: if the two columns are read
    // on different scales the elapsed share is wrong from the first second.
    const addObjectUseCase = new AddObjectUseCase(objectRepository);

    const created = await addObjectUseCase.execute({
      name: "4K Monitor",
      price: 45000,
      reviewDays: 30,
    });

    const spanInDays =
      (created.reviewAt.getTime() - created.createdAt.getTime()) /
      (1000 * 60 * 60 * 24);

    assert.ok(
      Math.abs(spanInDays - 30) < 0.01,
      `expected a 30 day wait, measured ${spanInDays.toFixed(3)} days`,
    );
  });

  test("should report no progress on a freshly created object", async () => {
    // With a shifted created_at the elapsed time goes negative and the bar
    // clamps to zero for the length of the offset, so assert the boundary from
    // both sides rather than just `>= 0`.
    const created = await objectRepository.create({
      name: "Mechanical Keyboard",
      price: 12000,
      reviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const progress = progressPercentage(
      created.createdAt,
      created.reviewAt,
      new Date(),
    );

    assert.ok(progress >= 0, `progress went negative: ${progress}`);
    assert.ok(
      progress < 0.1,
      `a new object should sit at the start of its wait, got ${progress}%`,
    );
  });

  test("should advance progress once the wait has really started", async () => {
    const now = new Date();
    const createdAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const reviewAt = new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000);

    // Written explicitly rather than through the use case, so the row carries a
    // wait that is already one day into ten.
    const [inserted] = await db
      .insert(objectsTable)
      .values({ name: "Desk Lamp", price: 4000, createdAt, reviewAt })
      .returning();

    const progress = progressPercentage(
      inserted.createdAt,
      inserted.reviewAt,
      now,
    );

    assert.ok(
      Math.abs(progress - 10) < 0.1,
      `expected roughly 10% elapsed, got ${progress}%`,
    );
  });

  test("should read back a push subscription created_at as the current instant", async () => {
    const repository = new DrizzlePushSubscriptionRepository(db);
    const before = Date.now();

    await repository.create({
      endpoint: "https://fcm.googleapis.com/fcm/send/aaa",
      p256dh: "public-key-a",
      auth: "auth-secret-a",
      userAgent: "iPhone",
    });

    const [row] = await db.select().from(pushSubscriptionsTable);
    const drift = row.createdAt.getTime() - before;

    assert.ok(
      Math.abs(drift) < SLACK_MS,
      `created_at is off by ${Math.round(drift / 1000)}s`,
    );
  });
});
