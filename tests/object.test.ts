import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { objectsTable } from "@/db/schema";
import {
  handleDelete,
  handlePost,
  handleSelect,
} from "@/app/api/objects/route";
import { AddObjectUseCase } from "../src/use-cases/add-object";
import { DrizzleObjectRepository } from "../src/repositories/drizzle-object-repository";
import { SelectObjectUseCase } from "@/use-cases/select-object";
import { DeleteObjectUseCase } from "@/use-cases/delete-object";
import { PutObjectUseCase } from "@/use-cases/put-object";

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

  test("should respond with 400 if sent object name is not valid", async () => {
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

  test("should respond with 400 if sent object price is not valid", async () => {
    const mockRequest = new Request("http://localhost:3000/api/objects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Mechanical Keyboard",
        price: -1,
        reviewDays: 14,
      }),
    });
    const resp = await handlePost(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 400);
    assert.strictEqual(json.error, "Price needs to be more than 0");
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

describe("Select Objects Feature", () => {
  let pg: PGlite;
  let db: any;
  let objectRepository: DrizzleObjectRepository;
  let selectObjectUseCase: SelectObjectUseCase;
  let addObjectUseCase: AddObjectUseCase;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    objectRepository = new DrizzleObjectRepository(db);
    selectObjectUseCase = new SelectObjectUseCase(objectRepository);
    addObjectUseCase = new AddObjectUseCase(objectRepository);

    const input = {
      name: "Nintendo Switch",
      price: 30000,
      reviewDays: 30,
    };

    await addObjectUseCase.execute(input);
    await addObjectUseCase.execute(input);
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should return 2 rows after saving two objects", async () => {
    const dbRows = await selectObjectUseCase.execute();
    assert.strictEqual(dbRows.length, 2);
    assert.strictEqual(dbRows[0].name, "Nintendo Switch");
  });

  test("should return 2 rows with 200 from the API when requesting", async () => {
    const mockRequest = new Request("http://localhost:3000/api/objects", {
      method: "GET",
    });

    const resp = await handleSelect(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 200);
    assert.strictEqual(json.length, 2);
    assert.ok(Array.isArray(json), "Responce should be of array type");
  });
});

describe("Remove Object Feature", () => {
  let pg: PGlite;
  let db: any;
  let objectRepository: DrizzleObjectRepository;
  let addObjectUseCase: AddObjectUseCase;
  let selectObjectUseCase: SelectObjectUseCase;
  let deleteObjectUseCase: DeleteObjectUseCase;
  let id: string;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    objectRepository = new DrizzleObjectRepository(db);
    addObjectUseCase = new AddObjectUseCase(objectRepository);
    selectObjectUseCase = new SelectObjectUseCase(objectRepository);
    deleteObjectUseCase = new DeleteObjectUseCase(objectRepository);

    const input = {
      name: "Nintendo Switch",
      price: 30000,
      reviewDays: 30,
    };

    const result = await addObjectUseCase.execute(input);

    id = result.id;
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should delete object by id", async () => {
    let dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 1);

    await deleteObjectUseCase.execute(id);

    dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 0);
  });

  test("should do nothing if id is not present", async () => {
    await deleteObjectUseCase.execute(id);

    let dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 0);

    await deleteObjectUseCase.execute(id);

    dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 0);
  });

  test("should delete object through the api", async () => {
    const mockRequest = new Request(
      `http://localhost:3000/api/objects?id=${id}`,
      {
        method: "DELETE",
      },
    );
    const resp = await handleDelete(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 200);
    assert.strictEqual(json.message, "Deleted");

    const dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 0);
  });

  test("should throw if id is not in the url", async () => {
    const mockRequest = new Request(`http://localhost:3000/api/objects`, {
      method: "DELETE",
    });
    const resp = await handleDelete(mockRequest, db);
    const json = await resp.json();

    assert.strictEqual(resp.status, 400);
    assert.strictEqual(json.error, "Missing object ID");
  });
});

describe("Editing Object Feature", () => {
  let pg: PGlite;
  let db: any;
  let objectRepository: DrizzleObjectRepository;
  let addObjectUseCase: AddObjectUseCase;
  let selectObjectUseCase: SelectObjectUseCase;
  let putObjectUseCase: PutObjectUseCase;
  let id: string;

  beforeEach(async () => {
    pg = new PGlite();
    db = drizzle(pg);

    await migrate(db, { migrationsFolder: "./drizzle" });

    objectRepository = new DrizzleObjectRepository(db);
    addObjectUseCase = new AddObjectUseCase(objectRepository);
    selectObjectUseCase = new SelectObjectUseCase(objectRepository);
    putObjectUseCase = new PutObjectUseCase(objectRepository);

    const input = {
      name: "Nintendo Switch",
      price: 30000,
      reviewDays: 30,
    };

    const result = await addObjectUseCase.execute(input);

    id = result.id;
  });

  afterEach(async () => {
    await pg.close();
  });

  test("should edit object by id with new data", async () => {
    const input = {
      name: "Different Object",
      price: 50000,
      reviewDays: 10,
    };

    const result = await putObjectUseCase.execute(id, input);

    assert.strictEqual(result.name, input.name);
    assert.strictEqual(result.price, input.price);

    const diffInMs = result.reviewAt.getTime() - result.createdAt.getTime();
    const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
    assert.strictEqual(diffInDays, 10);

    const dbRows = await db.select().from(objectsTable);
    assert.strictEqual(dbRows.length, 1);
    assert.strictEqual(dbRows[0].name, "Different Object");
    assert.strictEqual(dbRows[0].price, 50000);
  });
});
