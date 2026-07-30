export interface NotificationProvider {
  id: string;
  send(message: string): Promise<boolean>;
}

export class NotificationService {
  private providers: NotificationProvider[] = [];

  registerProvider(provider: NotificationProvider) {
    this.providers.push(provider);
  }

  /**
   * Empties the registry. The service is a module-level singleton, so anything
   * registered outlives the code that registered it — tests need a way to start
   * clean without reaching into the private field.
   */
  reset() {
    this.providers = [];
  }

  async notify(message: string): Promise<boolean> {
    if (this.providers.length === 0) {
      console.warn("[NOTIFICATION] No notification providers enabled.");
      return false;
    }

    const results = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          return await provider.send(message);
        } catch (err) {
          console.error(`[NOTIFICATION] Provider ${provider.id} failed`, err);
          return false;
        }
      }),
    );

    return results.some((res) => res === true);
  }
}
