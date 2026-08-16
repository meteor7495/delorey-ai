/**
 * Bale Bot API quirks (eng notes — not product scope):
 * - Base: https://tapi.bale.ai/bot{token}/{method} (Telegram-compatible methods)
 * - Webhook HTTPS ports commonly limited (443 / 88)
 * - setWebhook may not accept Telegram-style secret_token; we still verify
 *   X-Bale-Bot-Api-Secret-Token (and Telegram header as fallback) on our side
 * - Outbound text is treated as Markdown — escape meta chars for plain replies
 */

export type BaleUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: { id: number; username?: string };
  };
};

/** Escape Markdown meta so plain operator/AI text does not break on Bale. */
export function escapeBaleMarkdown(text: string): string {
  return text.replace(/([_*\[\]()])/g, '\\$1');
}

export class BaleBotClient {
  constructor(
    private readonly token: string,
    private readonly live: boolean,
  ) {}

  private url(method: string) {
    return `https://tapi.bale.ai/bot${this.token}/${method}`;
  }

  async getMe(): Promise<{ ok: boolean; username?: string; error?: string }> {
    if (!this.live) {
      return { ok: true, username: 'seloma_bale_dev_bot' };
    }
    try {
      const res = await fetch(this.url('getMe'));
      const json = (await res.json()) as {
        ok: boolean;
        result?: { username?: string };
        description?: string;
      };
      if (!json.ok) {
        return { ok: false, error: json.description ?? 'getMe failed' };
      }
      return { ok: true, username: json.result?.username };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'network' };
    }
  }

  async sendMessage(
    chatId: string,
    text: string,
  ): Promise<{ ok: boolean; mocked?: boolean; error?: string }> {
    if (!this.live) {
      return { ok: true, mocked: true };
    }
    try {
      const res = await fetch(this.url('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: escapeBaleMarkdown(text),
        }),
      });
      const json = (await res.json()) as {
        ok: boolean;
        description?: string;
      };
      if (!json.ok) {
        return { ok: false, error: json.description ?? 'send failed' };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'network' };
    }
  }
}
