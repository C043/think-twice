import { DrizzleObjectRepository } from "@/repositories/drizzle-object-repository";
import { SelectObject } from "@/db/schema";

export class SelectObjectUseCase {
  constructor(private objectRepository: DrizzleObjectRepository) {}

  async execute(): Promise<SelectObject[]> {
    return await this.objectRepository.findAll();
  }
}
