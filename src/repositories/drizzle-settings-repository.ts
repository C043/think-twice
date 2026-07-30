import { settingsTable } from "@/db/schema";
import { SelectSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

const SETTINGS_ROW_ID = 1;

export class DrizzleSettingsRepository {
  constructor(private db: any) {}

  /**
   * Settings are a single row that may not exist yet. Rather than requiring a
   * seed step in every deployment, the first read inserts the schema defaults.
   */
  async findOrCreate(): Promise<SelectSettings> {
    const [existing] = await this.db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, SETTINGS_ROW_ID))
      .limit(1);

    if (existing) {
      return existing;
    }

    const [created] = await this.db
      .insert(settingsTable)
      .values({ id: SETTINGS_ROW_ID })
      .onConflictDoNothing()
      .returning();

    // A concurrent request may have won the insert, in which case the
    // conflicting statement returns nothing and the row is already there.
    if (created) {
      return created;
    }

    const [raced] = await this.db
      .select()
      .from(settingsTable)
      .where(eq(settingsTable.id, SETTINGS_ROW_ID))
      .limit(1);

    return raced;
  }

  async update(data: {
    locale: string;
    currency: string;
  }): Promise<SelectSettings> {
    await this.findOrCreate();

    const [updated] = await this.db
      .update(settingsTable)
      .set({
        locale: data.locale,
        currency: data.currency,
        updatedAt: new Date(),
      })
      .where(eq(settingsTable.id, SETTINGS_ROW_ID))
      .returning();

    return updated;
  }
}
