import { db as productionDb } from "@/db/client";
import { objectsTable } from "@/db/schema";
import { and, lt, eq } from "drizzle-orm";
import cron from "node-cron";
import { NotificationService } from "./notifications/notification-service";
import { TelegramProvider } from "./notifications/providers/telegram";

const notificationService = new NotificationService();

if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
  notificationService.registerProvider(
    new TelegramProvider(
      process.env.TELEGRAM_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
    ),
  );
}

async function sendNotification(objectName: string) {
  console.log(`[WORKER] NOTIFICATION FOR: "${objectName}"`);

  await notificationService.notify(`Check ${objectName} do you still want it?`);
}

export async function checkReviewsJob(db = productionDb) {
  try {
    const now = new Date();

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
      await sendNotification(obj.name);

      await db
        .update(objectsTable)
        .set({ notified: true })
        .where(eq(objectsTable.id, obj.id));
    }

    return expiredObjects.length;
  } catch (error) {
    console.error("[WORKER CRITICAL ERROR]:", error);
  }
}

export function startScheduledWorker() {
  console.log(
    "[WORKER] Worker activated successfully. Checking every minute...",
  );

  cron.schedule("* * * * *", async () => {
    await checkReviewsJob();
  });
}
