import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { objectsTable } from "@/db/schema";
import { handlePost } from "@/app/api/objects/route";
import { AddObjectUseCase } from "../src/use-cases/add-object";
import { DrizzleObjectRepository } from "../src/repositories/drizzle-object-repository";

describe("Add Object Feature", () => {
  let pg: PGlite;
  let db: any;
  let objectRepository: DrizzleObjectRepository;
  let addObjectUseCase: AddObjectUseCase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    objectRepository = new DrizzleObjectRepository(db);
    addObjectUseCase = new AddObjectUseCase(objectRepository);
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should respond with 201 and save data in database through the API", async () => {
    const mockRequest = new Request("http://localhost:3000/api/objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "4K Monitor",
        price: 45000,
        reviewDays: 30,
      }),
    });

    const resp = await handlePost(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 201);
    assert.strictEqual(json.name, "4K Monitor");
    assert.ok(json.id);

    const rows = await db.select().from(objectsTable);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].name, "4K Monitor");
  });

  test("should respond with 400 if sent data are not valid", async () => {
    const mockRequest = new Request("http://localhost:3000/api/objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "",
        price: 45000,
        reviewDays: 14,
      }),
    });
    const resp = await handlePost(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 400);
    assert.strictEqual(json.error, "Object name is mandatory.");
  });

  test("should save the object in the database with the right timestamps", async () => {
    const input = {
      name: "Nintendo Switch",
      price: 30000,
      reviewDays: 30,
    };

    const result = await addObjectUseCase.execute(input);

    assert.ok(result.id);
    assert.strictEqual(result.name, input.name);
    assert.strictEqual(result.price, input.price);

    const diffInMs = result.reviewAt.getTime() - result.createdAt.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffInDays, 30);

    const dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 1);
    assert.strictEqual(dbRows[0].name, "Nintendo Switch");
  });
});
