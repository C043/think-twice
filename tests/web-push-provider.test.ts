import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { pushSubscriptionsTable } from "@/db/schema";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";
import {
  WebPushProvider,
  WebPushSender,
} from "@/lib/notifications/providers/web-push";
import type { PgliteDatabase } from "drizzle-orm/pglite";

const VAPID = {
  publicKey: "test-public-key",
  privateKey: "test-private-key",
  subject: "mailto:test@think-twice.local",
};

const ENDPOINT_A = "https://fcm.googleapis.com/fcm/send/aaa";
const ENDPOINT_B = "https://web.push.apple.com/bbb";

class PushError extends Error {
  statusCode: number;

  constructor(statusCode: number) {
    super(`Push failed with ${statusCode}`);
    this.statusCode = statusCode;
  }
}

describe("Web Push Provider", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let repository: DrizzlePushSubscriptionRepository;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    repository = new DrizzlePushSubscriptionRepository(db);
  });

  afterEach(async () => {
    await pg.close();
  });

  const seed = async (...endpoints: string[]) => {
    for (const endpoint of endpoints) {
      await repository.create({
        endpoint,
        p256dh: `p256dh-for-${endpoint}`,
        auth: `auth-for-${endpoint}`,
      });
    }
  };

  test("should return false if VAPID keys are missing", async () => {
    await seed(ENDPOINT_A);

    let senderCalls = 0;
    const sender: WebPushSender = async () => {
      senderCalls += 1;
    };

    const provider = new WebPushProvider(
      repository,
      { publicKey: "", privateKey: "", subject: VAPID.subject },
      sender,
    );

    const result = await provider.send("Check Monitor, do you still want it?");

    assert.strictEqual(result, false);
    assert.strictEqual(senderCalls, 0, "Must not attempt to send without VAPID");
  });

  test("should return false if there are no stored subscriptions", async () => {
    let senderCalls = 0;
    const sender: WebPushSender = async () => {
      senderCalls += 1;
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    const result = await provider.send("Check Monitor, do you still want it?");

    assert.strictEqual(result, false);
    assert.strictEqual(senderCalls, 0);
  });

  test("should deliver to every stored subscription and return true", async () => {
    await seed(ENDPOINT_A, ENDPOINT_B);

    const reached: string[] = [];
    const sender: WebPushSender = async (subscription) => {
      reached.push(subscription.endpoint);
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    const result = await provider.send("Check Monitor, do you still want it?");

    assert.strictEqual(result, true);
    assert.strictEqual(reached.length, 2);
    assert.ok(reached.includes(ENDPOINT_A));
    assert.ok(reached.includes(ENDPOINT_B));
  });

  test("should send a JSON payload carrying title, body and url", async () => {
    await seed(ENDPOINT_A);

    let receivedPayload = "";
    let receivedKeys: { p256dh: string; auth: string } | undefined;
    const sender: WebPushSender = async (subscription, payload) => {
      receivedPayload = payload;
      receivedKeys = subscription.keys;
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    await provider.send("Check Monitor, do you still want it?");

    const parsed = JSON.parse(receivedPayload);

    assert.strictEqual(parsed.title, "Think Twice");
    assert.strictEqual(parsed.body, "Check Monitor, do you still want it?");
    assert.strictEqual(parsed.url, "/");
    assert.deepStrictEqual(receivedKeys, {
      p256dh: `p256dh-for-${ENDPOINT_A}`,
      auth: `auth-for-${ENDPOINT_A}`,
    });
  });

  test("should delete the subscription when the push service replies 410 Gone", async () => {
    await seed(ENDPOINT_A);

    const sender: WebPushSender = async () => {
      throw new PushError(410);
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    const result = await provider.send("Check Monitor, do you still want it?");

    assert.strictEqual(result, false);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 0, "Expired subscription must be pruned");
  });

  test("should delete the subscription when the push service replies 404 Not Found", async () => {
    await seed(ENDPOINT_A);

    const sender: WebPushSender = async () => {
      throw new PushError(404);
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    await provider.send("Check Monitor, do you still want it?");

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 0);
  });

  test("should keep the subscription when the failure is transient", async () => {
    await seed(ENDPOINT_A);

    const sender: WebPushSender = async () => {
      throw new PushError(500);
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    const result = await provider.send("Check Monitor, do you still want it?");

    assert.strictEqual(result, false);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(
      rows.length,
      1,
      "A 500 is transient and must not drop the subscription",
    );
  });

  test("should return true if at least one subscription is reachable", async () => {
    await seed(ENDPOINT_A, ENDPOINT_B);

    const sender: WebPushSender = async (subscription) => {
      if (subscription.endpoint === ENDPOINT_A) {
        throw new PushError(410);
      }
    };

    const provider = new WebPushProvider(repository, VAPID, sender);

    const result = await provider.send("Check Monitor, do you still want it?");

    assert.strictEqual(result, true);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(
      rows[0].endpoint,
      ENDPOINT_B,
      "Only the dead endpoint must be pruned",
    );
  });
});
