import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { objectTable } from "@/db/schema";
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

    const dbRows = await db.select().from(objectTable);
    assert.strictEqual(dbRows.length, 1);
    assert.strictEqual(dbRows[0].name, "Nintendo Switch");
  });
});
