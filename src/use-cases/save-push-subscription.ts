import { AppError } from "@/errors/AppError";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";

interface SavePushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
}

export class SavePushSubscriptionUseCase {
  constructor(private subscriptionRepository: DrizzlePushSubscriptionRepository) {}

  async execute(input: SavePushSubscriptionInput) {
    if (!input.endpoint || input.endpoint.trim() === "") {
      throw new AppError("Subscription endpoint is mandatory", 400);
    }
    if (!input.keys || !input.keys.p256dh || !input.keys.auth) {
      throw new AppError("Subscription encryption keys are mandatory", 400);
    }

    return await this.subscriptionRepository.create({
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent,
    });
  }
}
