import { objectsTable } from "@/db/schema";
import { and, lt, eq } from "drizzle-orm";
import cron from "node-cron";
import { NotificationService } from "./notifications/notification-service";
import { TelegramProvider } from "./notifications/providers/telegram";

export const notificationService = new NotificationService();

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  notificationService.registerProvider(
    new TelegramProvider(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
    ),
  );
}

async function sendNotification(objectName: string): Promise<boolean> {
  console.log(`[WORKER] NOTIFICATION FOR: "${objectName}"`);

  return await notificationService.notify(
    `Check ${objectName}, do you still want it?`,
  );
}

export async function checkReviewsJob(db?: any) {
  try {
    const now = new Date();

    if (!db) {
      const { db: productionDb } = await import("@/db/client");
      db = productionDb;
    }

    if (!db) return;

    const expiredObjects = await db
      .select()
      .from(objectsTable)
      .where(
        and(lt(objectsTable.reviewAt, now), eq(objectsTable.notified, false)),
      );

    if (expiredObjects.length === 0) {
      console.log("No new expired objects found.");
      return;
    }

    console.log(`[WORKER] Found ${expiredObjects.length} expired objects.`);

    for (const obj of expiredObjects) {
      const success = await sendNotification(obj.name);

      if (success) {
        await db
          .update(objectsTable)
          .set({ notified: true })
          .where(eq(objectsTable.id, obj.id));
      }
    }

    return expiredObjects.length;
  } catch (error) {
    console.error("[WORKER CRITICAL ERROR]:", error);
  }
}

const globalForWorker = globalThis as unknown as {
  subtitlesCronStarted: boolean | undefined;
};

export function startScheduledWorker() {
  if (globalForWorker.subtitlesCronStarted) {
    return;
  }

  console.log(
    "[WORKER] Worker activated successfully. Checking every minute...",
  );

  cron.schedule("* * * * *", async () => {
    await checkReviewsJob();
  });

  globalForWorker.subtitlesCronStarted = true;
}
