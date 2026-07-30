import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { pushSubscriptionsTable } from "@/db/schema";
import { handleDelete, handlePost, handleSelect } from "@/app/api/push/route";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";
import { SavePushSubscriptionUseCase } from "@/use-cases/save-push-subscription";
import { DeletePushSubscriptionUseCase } from "@/use-cases/delete-push-subscription";
import { SelectPushSubscriptionsUseCase } from "@/use-cases/select-push-subscriptions";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { AppError } from "@/errors/AppError";

const SUBSCRIPTION_A = {
  endpoint: "https://fcm.googleapis.com/fcm/send/aaa",
  keys: { p256dh: "public-key-a", auth: "auth-secret-a" },
};

const SUBSCRIPTION_B = {
  endpoint: "https://web.push.apple.com/bbb",
  keys: { p256dh: "public-key-b", auth: "auth-secret-b" },
};

describe("Push Subscription Repository", () => {
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

  test("should save a subscription and return the stored record", async () => {
    const saved = await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: SUBSCRIPTION_A.keys.p256dh,
      auth: SUBSCRIPTION_A.keys.auth,
      userAgent: "iPhone",
    });

    assert.strictEqual(saved.endpoint, SUBSCRIPTION_A.endpoint);
    assert.strictEqual(saved.p256dh, SUBSCRIPTION_A.keys.p256dh);
    assert.strictEqual(saved.auth, SUBSCRIPTION_A.keys.auth);
    assert.ok(saved.id, "Saved subscription should have an id");
  });

  test("should not duplicate rows when the same endpoint subscribes twice", async () => {
    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: "old-key",
      auth: "old-auth",
    });

    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: "rotated-key",
      auth: "rotated-auth",
    });

    const rows = await db.select().from(pushSubscriptionsTable);

    assert.strictEqual(rows.length, 1, "Endpoint must be unique");
    assert.strictEqual(
      rows[0].p256dh,
      "rotated-key",
      "Re-subscribing should refresh the stored keys",
    );
    assert.strictEqual(rows[0].auth, "rotated-auth");
  });

  test("should return every stored subscription", async () => {
    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: SUBSCRIPTION_A.keys.p256dh,
      auth: SUBSCRIPTION_A.keys.auth,
    });
    await repository.create({
      endpoint: SUBSCRIPTION_B.endpoint,
      p256dh: SUBSCRIPTION_B.keys.p256dh,
      auth: SUBSCRIPTION_B.keys.auth,
    });

    const all = await repository.findAll();

    assert.strictEqual(all.length, 2);
  });

  test("should delete a subscription by endpoint", async () => {
    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: SUBSCRIPTION_A.keys.p256dh,
      auth: SUBSCRIPTION_A.keys.auth,
    });
    await repository.create({
      endpoint: SUBSCRIPTION_B.endpoint,
      p256dh: SUBSCRIPTION_B.keys.p256dh,
      auth: SUBSCRIPTION_B.keys.auth,
    });

    await repository.deleteByEndpoint(SUBSCRIPTION_A.endpoint);

    const rows = await db.select().from(pushSubscriptionsTable);

    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].endpoint, SUBSCRIPTION_B.endpoint);
  });
});

describe("Save Push Subscription Feature", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let saveUseCase: SavePushSubscriptionUseCase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    saveUseCase = new SavePushSubscriptionUseCase(
      new DrizzlePushSubscriptionRepository(db),
    );
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should persist a valid subscription", async () => {
    const saved = await saveUseCase.execute({
      endpoint: SUBSCRIPTION_A.endpoint,
      keys: SUBSCRIPTION_A.keys,
      userAgent: "Android",
    });

    assert.strictEqual(saved.endpoint, SUBSCRIPTION_A.endpoint);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].userAgent, "Android");
  });

  test("should reject a subscription without endpoint", async () => {
    await assert.rejects(
      async () =>
        await saveUseCase.execute({
          endpoint: "",
          keys: SUBSCRIPTION_A.keys,
        }),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  test("should reject a subscription without encryption keys", async () => {
    await assert.rejects(
      async () =>
        await saveUseCase.execute({
          endpoint: SUBSCRIPTION_A.endpoint,
          keys: { p256dh: "", auth: "" },
        }),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });
});

describe("Delete Push Subscription Feature", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let deleteUseCase: DeletePushSubscriptionUseCase;
  let repository: DrizzlePushSubscriptionRepository;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    repository = new DrizzlePushSubscriptionRepository(db);
    deleteUseCase = new DeletePushSubscriptionUseCase(repository);
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should remove the subscription matching the endpoint", async () => {
    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: SUBSCRIPTION_A.keys.p256dh,
      auth: SUBSCRIPTION_A.keys.auth,
    });

    await deleteUseCase.execute(SUBSCRIPTION_A.endpoint);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 0);
  });

  test("should reject a delete without endpoint", async () => {
    await assert.rejects(
      async () => await deleteUseCase.execute(""),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });
});

describe("Select Push Subscriptions Feature", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let selectUseCase: SelectPushSubscriptionsUseCase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    selectUseCase = new SelectPushSubscriptionsUseCase(
      new DrizzlePushSubscriptionRepository(db),
    );
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should return an empty list when nobody subscribed", async () => {
    const rows = await selectUseCase.execute();
    assert.deepStrictEqual(rows, []);
  });
});

describe("Push Subscription API", () => {
  let pg: PGlite;
  let db: PgliteDatabase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should respond with 201 and store the subscription through the API", async () => {
    const mockRequest = new Request("http://localhost:3000/api/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent": "iPhone Safari",
      },
      body: JSON.stringify(SUBSCRIPTION_A),
    });

    const response = await handlePost(mockRequest, db);

    assert.strictEqual(response.status, 201);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].endpoint, SUBSCRIPTION_A.endpoint);
    assert.strictEqual(rows[0].userAgent, "iPhone Safari");
  });

  test("should respond with 400 when the subscription payload is invalid", async () => {
    const mockRequest = new Request("http://localhost:3000/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: "https://example.com/x" }),
    });

    const response = await handlePost(mockRequest, db);

    assert.strictEqual(response.status, 400);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 0);
  });

  test("should respond with 200 and remove the subscription through the API", async () => {
    const repository = new DrizzlePushSubscriptionRepository(db);
    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: SUBSCRIPTION_A.keys.p256dh,
      auth: SUBSCRIPTION_A.keys.auth,
    });

    const mockRequest = new Request("http://localhost:3000/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: SUBSCRIPTION_A.endpoint }),
    });

    const response = await handleDelete(mockRequest, db);

    assert.strictEqual(response.status, 200);

    const rows = await db.select().from(pushSubscriptionsTable);
    assert.strictEqual(rows.length, 0);
  });

  test("should respond with 400 when deleting without an endpoint", async () => {
    const mockRequest = new Request("http://localhost:3000/api/push", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const response = await handleDelete(mockRequest, db);

    assert.strictEqual(response.status, 400);
  });

  test("should expose the subscription count without leaking endpoints", async () => {
    const repository = new DrizzlePushSubscriptionRepository(db);
    await repository.create({
      endpoint: SUBSCRIPTION_A.endpoint,
      p256dh: SUBSCRIPTION_A.keys.p256dh,
      auth: SUBSCRIPTION_A.keys.auth,
    });

    const mockRequest = new Request("http://localhost:3000/api/push", {
      method: "GET",
    });

    const response = await handleSelect(mockRequest, db);
    const body = await response.json();

    assert.strictEqual(response.status, 200);
    assert.strictEqual(body.count, 1);
    assert.strictEqual(
      JSON.stringify(body).includes(SUBSCRIPTION_A.endpoint),
      false,
      "The API must not expose raw push endpoints",
    );
  });
});
