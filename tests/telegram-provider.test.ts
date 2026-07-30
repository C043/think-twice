import { TelegramProvider } from "@/lib/notifications/providers/telegram";
import assert from "assert";
import { test, afterEach, beforeEach, describe } from "node:test";

describe("Telegram Provider", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("should return false if token or chatId is missing", async () => {
    const provider = new TelegramProvider("", "");
    const result = await provider.send("Test message");

    assert.strictEqual(result, false, "Should fail if credentials are missing");
  });

  test("should return true if Telegram API responds with 200 OK", async () => {
    const mockToken = "123456:ABCDE";
    const mockChatId = "987654321";
    const messageToSend = "*Oggetto Scaduto!*";

    globalThis.fetch = async (url, options) => {
      assert.strictEqual(
        url.toString(),
        `https://api.telegram.org/bot${mockToken}/sendMessage`,
      );

      const body = JSON.parse(options?.body as string);
      assert.strictEqual(body.chat_id, mockChatId);
      assert.strictEqual(body.text, messageToSend);
      assert.strictEqual(body.parse_mode, "Markdown");

      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, result: {} }),
      } as Response;
    };

    const provider = new TelegramProvider(mockToken, mockChatId);
    const result = await provider.send(messageToSend);

    assert.strictEqual(
      result,
      true,
      "Provider should return true if fetch is successful",
    );
  });

  test("should return false if Telegram API responds with an error", async () => {
    globalThis.fetch = async () => {
      return {
        ok: false,
        status: 400,
        headers: new Headers(),
        json: async () => ({
          ok: false,
          description: "Bad Request: chat not found",
        }),
      } as Response;
    };

    const provider = new TelegramProvider("valid_token", "invalid_chat_id");
    const result = await provider.send("Hello");

    assert.strictEqual(
      result,
      false,
      "Provider should handle API fail returning false",
    );
  });
});
