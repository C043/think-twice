import { NotificationProvider } from "../notification-service";

export class TelegramProvider implements NotificationProvider {
  id = "telegram";
  private botToken: string;
  private chatId: string;

  constructor(botToken = process.env.TELEGRAM_BOT_TOKEN || "", chatId = "") {
    this.botToken = botToken;
    this.chatId = chatId;
  }

  async send(message: string): Promise<boolean> {
    if (!this.botToken || !this.chatId) {
      console.warn(
        "[TELEGRAM PROVIDER] Missing botToken or chatId. Cannot send message.",
      );
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;

      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        console.error(
          "[TELEGRAM PROVIDER] Telegram API responded with error:",
          errorData,
        );
        return false;
      }

      return true;
    } catch (err) {
      console.error("[TELEGRAM PROVIDER CRITICAL ERROR]", err);
      return false;
    }
  }
}
