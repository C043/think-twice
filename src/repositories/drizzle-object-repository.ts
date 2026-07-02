import { objectsTable } from "@/db/schema";
import { InsertObject, SelectObject } from "@/db/schema";

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
}
