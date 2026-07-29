import { AppError } from "@/errors/AppError";
import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";

export class DeletePushSubscriptionUseCase {
  constructor(private subscriptionRepository: DrizzlePushSubscriptionRepository) {}

  async execute(endpoint: string): Promise<void> {
    if (!endpoint || endpoint.trim() === "") {
      throw new AppError("Subscription endpoint is mandatory", 400);
    }

    await this.subscriptionRepository.deleteByEndpoint(endpoint);
  }
}
