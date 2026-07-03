import { AppError } from "@/errors/AppError";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";

interface PutObjectInput {
  name: string;
  price: number;
  reviewDays: number;
}

export class PutObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(id: string, input: PutObjectInput) {
    if (!input.name || input.name.trim() === "") {
      throw new AppError("Object name is mandatory", 400);
    }
    if (input.price <= 0) {
      throw new AppError("Price needs to be more than 0", 400);
    }

    const found = await this.objectRepository.findById(id);

    if (!found) {
      throw new AppError("Object not found", 404);
    }

    const createdAt = found.createdAt;
    const reviewAt = new Date();
    reviewAt.setDate(createdAt.getDate() + input.reviewDays);

    return await this.objectRepository.update(id, {
      name: input.name,
      price: input.price,
      reviewAt: reviewAt,
    });
  }
}
