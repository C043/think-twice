import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import { settingsTable } from "@/db/schema";
import { handlePut, handleSelect } from "@/app/api/settings/route";
import { DrizzleSettingsRepository } from "@/repositories/drizzle-settings-repository";
import { SelectSettingsUseCase } from "@/use-cases/select-settings";
import { PutSettingsUseCase } from "@/use-cases/put-settings";
import type { PgliteDatabase } from "drizzle-orm/pglite";
import { AppError } from "@/errors/AppError";

const DEFAULT_LOCALE = "it-IT";
const DEFAULT_CURRENCY = "EUR";

describe("Settings Repository", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let repository: DrizzleSettingsRepository;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    repository = new DrizzleSettingsRepository(db);
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should seed the row with defaults on first read", async () => {
    const settings = await repository.findOrCreate();

    assert.strictEqual(settings.locale, DEFAULT_LOCALE);
    assert.strictEqual(settings.currency, DEFAULT_CURRENCY);

    const rows = await db.select().from(settingsTable);
    assert.strictEqual(rows.length, 1);
  });

  test("should not create a second row when read twice", async () => {
    await repository.findOrCreate();
    await repository.findOrCreate();

    const rows = await db.select().from(settingsTable);
    assert.strictEqual(rows.length, 1, "settings must stay a single row");
  });

  test("should persist an update and return the stored row", async () => {
    await repository.findOrCreate();

    const updated = await repository.update({
      locale: "en-GB",
      currency: "GBP",
    });

    assert.strictEqual(updated.locale, "en-GB");
    assert.strictEqual(updated.currency, "GBP");

    const rows = await db.select().from(settingsTable);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].locale, "en-GB");
    assert.strictEqual(rows[0].currency, "GBP");
  });

  test("should move updated_at forward on write", async () => {
    const seeded = await repository.findOrCreate();

    await new Promise((resolve) => setTimeout(resolve, 5));
    const updated = await repository.update({ locale: "en-GB", currency: "GBP" });

    assert.ok(
      updated.updatedAt.getTime() >= seeded.updatedAt.getTime(),
      "updated_at should not go backwards",
    );
  });

  test("should reject a second row at the database level", async () => {
    await repository.findOrCreate();

    await assert.rejects(
      async () =>
        await db.execute(
          sql`insert into settings (id, locale, currency) values (2, 'en-GB', 'GBP')`,
        ),
      "the singleton check constraint should refuse id <> 1",
    );
  });
});

describe("Select Settings Feature", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let selectSettingsUseCase: SelectSettingsUseCase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    selectSettingsUseCase = new SelectSettingsUseCase(
      new DrizzleSettingsRepository(db),
    );
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should return the defaults when nothing was ever saved", async () => {
    const settings = await selectSettingsUseCase.execute();

    assert.strictEqual(settings.locale, DEFAULT_LOCALE);
    assert.strictEqual(settings.currency, DEFAULT_CURRENCY);
  });

  test("should respond with the settings through the API", async () => {
    const mockRequest = new Request("http://localhost:3000/api/settings");

    const resp = await handleSelect(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 200);
    assert.strictEqual(json.locale, DEFAULT_LOCALE);
    assert.strictEqual(json.currency, DEFAULT_CURRENCY);
  });
});

describe("Put Settings Feature", () => {
  let pg: PGlite;
  let db: PgliteDatabase;
  let putSettingsUseCase: PutSettingsUseCase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    putSettingsUseCase = new PutSettingsUseCase(
      new DrizzleSettingsRepository(db),
    );
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should save a valid locale and currency", async () => {
    const result = await putSettingsUseCase.execute({
      locale: "en-GB",
      currency: "GBP",
    });

    assert.strictEqual(result.locale, "en-GB");
    assert.strictEqual(result.currency, "GBP");
  });

  test("should canonicalise the casing of the locale", async () => {
    const result = await putSettingsUseCase.execute({
      locale: "it-it",
      currency: "EUR",
    });

    assert.strictEqual(result.locale, "it-IT");
  });

  test("should uppercase the currency code", async () => {
    const result = await putSettingsUseCase.execute({
      locale: "en-GB",
      currency: "usd",
    });

    assert.strictEqual(result.currency, "USD");
  });

  test("should reject a structurally invalid locale", async () => {
    await assert.rejects(
      async () =>
        await putSettingsUseCase.execute({ locale: "!!!", currency: "EUR" }),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  test("should reject a currency that is not an ISO code", async () => {
    await assert.rejects(
      async () =>
        await putSettingsUseCase.execute({ locale: "en-GB", currency: "EURO" }),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  test("should reject a missing locale", async () => {
    await assert.rejects(
      async () =>
        await putSettingsUseCase.execute({
          locale: "",
          currency: "EUR",
        }),
      (err: unknown) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.status, 400);
        return true;
      },
    );
  });

  test("should not write anything when validation fails", async () => {
    await putSettingsUseCase.execute({ locale: "en-GB", currency: "GBP" });

    await assert.rejects(
      async () =>
        await putSettingsUseCase.execute({ locale: "en-GB", currency: "EURO" }),
    );

    const rows = await db.select().from(settingsTable);
    assert.strictEqual(rows[0].currency, "GBP", "the rejected write must not land");
  });

  test("should update the settings through the API", async () => {
    const mockRequest = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: "en-US", currency: "USD" }),
    });

    const resp = await handlePut(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 200);
    assert.strictEqual(json.locale, "en-US");
    assert.strictEqual(json.currency, "USD");

    const rows = await db.select().from(settingsTable);
    assert.strictEqual(rows[0].locale, "en-US");
    assert.strictEqual(rows[0].currency, "USD");
  });

  test("should respond with 400 for an invalid payload through the API", async () => {
    const mockRequest = new Request("http://localhost:3000/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: "en-GB", currency: "NOPE" }),
    });

    const resp = await handlePut(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 400);
    assert.ok(json.error);
  });
});
