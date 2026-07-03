import { AppError } from "@/errors/AppError";
import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";

export class DeleteObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new AppError("Object Id is required for deletion", 400);
    }

    await this.objectRepository.delete(id);
  }
}
