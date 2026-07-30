import { objectsTable } from "@/db/schema";
import { and, lt, eq } from "drizzle-orm";
import cron from "node-cron";
import type { AppDatabase } from "@/db/types";
import { NotificationService } from "./notifications/notification-service";
import { TelegramProvider } from "./notifications/providers/telegram";
import { WebPushProvider } from "./notifications/providers/web-push";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";

export const notificationService = new NotificationService();

/**
 * Providers are registered when the worker boots and not at import time, so
 * that importing this module in tests never opens a production DB connection.
 */
export async function registerDefaultProviders() {
  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    notificationService.registerProvider(
      new TelegramProvider(
        process.env.TELEGRAM_BOT_TOKEN,
        process.env.TELEGRAM_CHAT_ID,
      ),
    );
  }

  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    const { db } = await import("@/db/client");

    notificationService.registerProvider(
      new WebPushProvider(new DrizzlePushSubscriptionRepository(db), {
        publicKey: process.env.VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY,
        subject: process.env.VAPID_SUBJECT || "mailto:admin@think-twice.local",
      }),
    );
  }
}

async function sendNotification(objectName: string): Promise<boolean> {
  console.log(`[WORKER] NOTIFICATION FOR: "${objectName}"`);

  return await notificationService.notify(
    `Check ${objectName}, do you still want it?`,
  );
}

export async function checkReviewsJob(db?: AppDatabase) {
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

export async function startScheduledWorker() {
  if (globalForWorker.subtitlesCronStarted) {
    return;
  }

  await registerDefaultProviders();

  console.log(
    "[WORKER] Worker activated successfully. Checking every minute...",
  );

  cron.schedule("* * * * *", async () => {
    await checkReviewsJob();
  });

  globalForWorker.subtitlesCronStarted = true;
}
