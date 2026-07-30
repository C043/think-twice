import { objectsTable } from "@/db/schema";
import { InsertObject, SelectObject } from "@/db/schema";
import { eq } from "drizzle-orm";

export class DrizzleObjectRepository {
  constructor(private db: any) {}

  async create(
    data: Omit<InsertObject, "id" | "createdAt">,
  ): Promise<SelectObject> {
    const [inserted] = await this.db
      .insert(objectsTable)
      .values({
        name: data.name,
        price: data.price,
        reviewAt: data.reviewAt,
      })
      .returning();

    return inserted;
  }

  async update(
    id: string,
    data: {
      name: string;
      price: number;
      reviewAt: Date;
      notified?: boolean;
    },
  ) {
    const [updatedRecord] = await this.db
      .update(objectsTable)
      .set(data)
      .where(eq(objectsTable.id, id))
      .returning();

    return updatedRecord;
  }

  async findById(id: string): Promise<SelectObject> {
    const [record] = await this.db
      .select()
      .from(objectsTable)
      .where(eq(objectsTable.id, id))
      .limit(1);

    return record;
  }

  async findAll() {
    return await this.db.select().from(objectsTable);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(objectsTable).where(eq(objectsTable.id, id));
  }
}
