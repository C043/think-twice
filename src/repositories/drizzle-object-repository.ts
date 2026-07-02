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

  async findAll() {
    return await this.db.select().from(objectsTable);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(objectsTable).where(eq(objectsTable.id, id));
  }
}
