import {
  NotificationProvider,
  NotificationService,
} from "@/lib/notifications/notification-service";
import assert from "assert";
import { test, beforeEach, describe } from "node:test";

class MockProvider implements NotificationProvider {
  id = "mock";
  wasCalled = false;
  lastMessage = "";

  async send(message: string): Promise<boolean> {
    this.wasCalled = true;
    this.lastMessage = message;
    return true;
  }
}

describe("Notification Service", () => {
  let service: NotificationService;
  let mockProvider: MockProvider;

  beforeEach(() => {
    service = new NotificationService();
    mockProvider = new MockProvider();
  });

  test("should register and trigger anabled providers", async () => {
    service.registerProvider(mockProvider);

    const success = await service.notify("Test Alert: Monitor is expiring!");

    assert.strictEqual(success, true);
    assert.strictEqual(mockProvider.wasCalled, true);
    assert.strictEqual(
      mockProvider.lastMessage,
      "Test Alert: Monitor is expiring!",
    );
  });

  test("should not fail if no providers are registered", async () => {
    const success = await service.notify("Hello?");
    assert.strictEqual(success, false);
  });

  test("should drop every provider on reset", async () => {
    // The service is a module-level singleton, so a test that registers a
    // provider leaks it into the next one. Reaching into the private field to
    // clear it is what this replaces.
    service.registerProvider(mockProvider);
    service.reset();

    const success = await service.notify("Anyone there?");

    assert.strictEqual(success, false);
    assert.strictEqual(mockProvider.wasCalled, false);
  });

  test("should accept registrations again after a reset", async () => {
    service.reset();
    service.registerProvider(mockProvider);

    assert.strictEqual(await service.notify("Back up"), true);
    assert.strictEqual(mockProvider.wasCalled, true);
  });

  test("should be safe to reset when empty", () => {
    assert.doesNotThrow(() => {
      service.reset();
      service.reset();
    });
  });
});
