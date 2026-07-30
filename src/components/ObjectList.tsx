import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { objectsTable } from "@/db/schema";
import ObjectListClient from "./ObjectListClient";
import { Hourglass } from "lucide-react";

async function getObjects() {
  try {
    // Soonest review first: the ones needing a decision belong at the top.
    const records = await db
      .select()
      .from(objectsTable)
      .orderBy(asc(objectsTable.reviewAt));
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
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/50 px-6 py-10 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Hourglass className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">Nothing on hold</p>
          <p className="max-w-[15rem] text-[13px] leading-relaxed text-muted">
            Add something you want to buy and let the timer do the thinking.
          </p>
        </div>
      </div>
    );
  }

  return <ObjectListClient initialObjects={objects} />;
}
