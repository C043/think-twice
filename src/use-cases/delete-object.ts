import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";

export class DeleteObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error("Object Id is required for deletion");
    }

    await this.objectRepository.delete(id);
  }
}
