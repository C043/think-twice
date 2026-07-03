import { AppError } from "@/errors/AppError";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";

interface AddObjectInput {
  name: string;
  price: number;
  reviewDays: number;
}

export class AddObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(input: AddObjectInput) {
    if (!input.name || input.name.trim() === "") {
      throw new AppError("Object name is mandatory", 400);
    }
    if (input.price <= 0) {
      throw new AppError("Price needs to be more than 0", 400);
    }

    const createdAt = new Date();
    const reviewAt = new Date();
    reviewAt.setDate(createdAt.getDate() + input.reviewDays);

    return await this.objectRepository.create({
      name: input.name,
      price: input.price,
      reviewAt: reviewAt,
    });
  }
}
