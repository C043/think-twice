import { DrizzlePushSubscriptionRepository } from "@/repositories/drizzle-push-subscription-repository";
import { SelectPushSubscription } from "@/db/schema";

export class SelectPushSubscriptionsUseCase {
  constructor(private subscriptionRepository: DrizzlePushSubscriptionRepository) {}

  async execute(): Promise<SelectPushSubscription[]> {
    return await this.subscriptionRepository.findAll();
  }
}
