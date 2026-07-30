import { DrizzleSettingsRepository } from "@/repositories/drizzle-settings-repository";

export class SelectSettingsUseCase {
  constructor(private settingsRepository: DrizzleSettingsRepository) {}

  async execute() {
    return await this.settingsRepository.findOrCreate();
  }
}
