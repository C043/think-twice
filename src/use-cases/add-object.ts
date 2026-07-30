import { AppError } from "@/errors/AppError";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";

interface AddObjectInput {
  name: string;
  price: number;
  reviewDays: number;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class AddObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(input: AddObjectInput) {
    if (!input.name || input.name.trim() === "") {
      throw new AppError("Object name is mandatory", 400);
    }
    if (input.price <= 0) {
      throw new AppError("Price needs to be more than 0", 400);
    }
    if (!Number.isFinite(input.reviewDays) || input.reviewDays < 1) {
      throw new AppError("Days to wait needs to be at least 1", 400);
    }

    const createdAt = new Date();
    const reviewAt = new Date(
      createdAt.getTime() + input.reviewDays * MS_PER_DAY,
    );

    return await this.objectRepository.create({
      name: input.name,
      price: input.price,
      reviewAt: reviewAt,
    });
  }
}
