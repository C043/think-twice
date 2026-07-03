import { db } from "@/db/client";
import { objectsTable, SelectObject } from "@/db/schema";
import DeleteObjectComponent from "./DeleteObjectComponent";
import ObjectListClient from "./ObjectListClient";

async function getObjects() {
  try {
    const records = await db.select().from(objectsTable);
    return records;
  } catch (err) {
    console.error("Error SSR", err);
    return [];
  }
}

export default async function ObjectList() {
  const objects = await getObjects();
  if (objects.length === 0) {
    return (
      <p className="text-zinc-500 text-sm">
        No objects saved yet, add one first!
      </p>
    );
  }
  return <ObjectListClient initialObjects={objects} />;
}
