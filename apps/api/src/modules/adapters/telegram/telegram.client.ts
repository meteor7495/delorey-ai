export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: { id: number; username?: string };
  };
};

export class TelegramBotClient {
  constructor(
    private readonly token: string,
    private readonly live: boolean,
  ) {}

  private url(method: string) {
    return `https://api.telegram.org/bot${this.token}/${method}`;
  }

  async getMe(): Promise<{ ok: boolean; username?: string; error?: string }> {
    if (!this.live) {
      return { ok: true, username: 'delorey_dev_bot' };
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
          text,
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
