import webpush from "web-push";
import { NotificationProvider } from "../notification-service";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface VapidDetails {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export type WebPushSender = (
  subscription: WebPushSubscription,
  payload: string,
) => Promise<unknown>;

const DEAD_SUBSCRIPTION_STATUSES = [404, 410];

/**
 * `web-push` rejects with a `WebPushError` carrying the push service's status,
 * but a network failure rejects with a plain Error and anything can be thrown.
 * Narrow rather than assume the shape.
 */
function pushStatusCode(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("statusCode" in err)) {
    return undefined;
  }

  const { statusCode } = err as { statusCode: unknown };

  return typeof statusCode === "number" ? statusCode : undefined;
}

function createWebPushSender(vapid: VapidDetails): WebPushSender {
  return async (subscription, payload) =>
    await webpush.sendNotification(subscription, payload, {
      vapidDetails: vapid,
      TTL: 60 * 60 * 24,
    });
}

export class WebPushProvider implements NotificationProvider {
  id = "web-push";
  private sender: WebPushSender;

  constructor(
    private subscriptionRepository: DrizzlePushSubscriptionRepository,
    private vapid: VapidDetails,
    sender?: WebPushSender,
  ) {
    this.sender = sender ?? createWebPushSender(vapid);
  }

  async send(message: string): Promise<boolean> {
    if (!this.vapid.publicKey || !this.vapid.privateKey) {
      console.warn(
        "[WEB PUSH PROVIDER] Missing VAPID keys. Cannot send notifications.",
      );
      return false;
    }

    const subscriptions = await this.subscriptionRepository.findAll();

    if (subscriptions.length === 0) {
      console.warn("[WEB PUSH PROVIDER] No devices subscribed.");
      return false;
    }

    const payload = JSON.stringify({
      title: "Think Twice",
      body: message,
      url: "/",
    });

    const results = await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await this.sender(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
          );

          return true;
        } catch (err) {
          const statusCode = pushStatusCode(err);

          if (statusCode !== undefined &&
              DEAD_SUBSCRIPTION_STATUSES.includes(statusCode)) {
            console.warn(
              `[WEB PUSH PROVIDER] Dropping expired subscription (${statusCode}).`,
            );
            await this.subscriptionRepository.deleteByEndpoint(
              subscription.endpoint,
            );
          } else {
            console.error("[WEB PUSH PROVIDER] Delivery failed", err);
          }

          return false;
        }
      }),
    );

    return results.some((res) => res === true);
  }
}
