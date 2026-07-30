import { pushSubscriptionsTable } from "@/db/schema";
import { InsertPushSubscription, SelectPushSubscription } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { AppDatabase } from "@/db/types";

export class DrizzlePushSubscriptionRepository {
  constructor(private db: AppDatabase) {}

  async create(
    data: Omit<InsertPushSubscription, "id" | "createdAt">,
  ): Promise<SelectPushSubscription> {
    const [inserted] = await this.db
      .insert(pushSubscriptionsTable)
      .values({
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        userAgent: data.userAgent,
      })
      .onConflictDoUpdate({
        target: pushSubscriptionsTable.endpoint,
        set: {
          p256dh: data.p256dh,
          auth: data.auth,
          userAgent: data.userAgent,
        },
      })
      .returning();

    return inserted;
  }

  async findAll(): Promise<SelectPushSubscription[]> {
    return await this.db.select().from(pushSubscriptionsTable);
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.db
      .delete(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.endpoint, endpoint));
  }
}
