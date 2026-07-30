import { AppError } from "@/errors/AppError";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";

interface PutObjectInput {
  name: string;
  price: number;
  reviewDays: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class PutObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(id: string, input: PutObjectInput) {
    if (!input.name || input.name.trim() === "") {
      throw new AppError("Object name is mandatory", 400);
    }
    if (input.price <= 0) {
      throw new AppError("Price needs to be more than 0", 400);
    }
    if (!Number.isFinite(input.reviewDays) || input.reviewDays < 1) {
      throw new AppError("Days to wait needs to be at least 1", 400);
    }

    const found = await this.objectRepository.findById(id);

    if (!found) {
      throw new AppError("Object not found", 404);
    }

    // The waiting period is measured from creation. Adding days through
    // `setDate(createdAt.getDate() + n)` used a day-of-month as if it were an
    // offset, so any object edited in a later month got an arbitrary date.
    const reviewAt = new Date(
      found.createdAt.getTime() + input.reviewDays * MS_PER_DAY,
    );

    return await this.objectRepository.update(id, {
      name: input.name,
      price: input.price,
      reviewAt: reviewAt,
      // The worker only picks up rows with `notified = false`. Pushing the
      // review back into the future has to re-arm it, or an already-notified
      // object stays silent forever.
      notified: reviewAt.getTime() > Date.now() ? false : found.notified,
    });
  }
}
