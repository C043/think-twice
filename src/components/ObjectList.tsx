import { db } from "@/db/client";
import { objectsTable } from "@/db/schema";

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

  return (
    <ul className="space-y-2 w-full">
      {objects.map((obj: any) => (
        <li
          key={obj.id}
          className="p-3 border dark:border-zinc-800 rounded-xl flex justify-between bg-zinc-50/50 dark:bg-zinc-900/50"
        >
          <span className="font-medium text-black dark:text-white">
            {obj.name}
          </span>
          <span className="text-zinc-500">{(obj.price / 100).toFixed(2)}</span>
        </li>
      ))}
    </ul>
  );
}
