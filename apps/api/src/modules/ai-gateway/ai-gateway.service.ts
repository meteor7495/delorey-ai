import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type CompleteInput = {
  system: string;
  user: string;
};

export type CompleteResult = {
  text: string;
  mode: 'mock' | 'live';
};

@Injectable()
export class AiGatewayService {
  constructor(private readonly config: ConfigService) {}

  async complete(input: CompleteInput): Promise<CompleteResult> {
    const mode = this.config.get<string>('AI_GATEWAY_MODE') ?? 'mock';
    if (mode === 'live') {
      // Slice 01: live provider wiring lands behind this interface only.
      // Without a key, fall back to mock so demos never invent outside context.
      const key = this.config.get<string>('OPENAI_API_KEY');
      if (!key) {
        return { text: this.mockFromContext(input), mode: 'mock' };
      }
    }
    return { text: this.mockFromContext(input), mode: 'mock' };
  }

  /**
   * Deterministic grounded reply for Slice 01 demos — only uses facts in the prompt's CONTEXT block.
   */
  private mockFromContext(input: CompleteInput): string {
    const block = input.system.match(/CONTEXT_JSON:([\s\S]*)$/);
    if (!block?.[1]) {
      return 'الان اطلاعات مطمئنی از کاتالوگ ندارم؛ لطفاً بعداً دوباره بپرسید یا با پشتیبانی فروشگاه صحبت کنید.';
    }
    try {
      const ctx = JSON.parse(block[1].trim()) as {
        syncHealth?: string;
        matches?: Array<{
          sku: string;
          title: string;
          price: number;
          inStock: boolean;
          currency: string;
        }>;
      };
      if (ctx.syncHealth && ctx.syncHealth !== 'healthy') {
        return 'همگام‌سازی فروشگاه سالم نیست؛ نمی‌توانم قیمت یا موجودی را با اطمینان بگویم.';
      }
      const matches = ctx.matches ?? [];
      if (matches.length === 0) {
        return 'این مورد را در کاتالوگ پیدا نکردم. اگر نام دقیق‌تری بدهید دوباره جستجو می‌کنم.';
      }
      const lines = matches.slice(0, 3).map((m) => {
        const stock = m.inStock ? 'موجود' : 'ناموجود';
        return `• ${m.title} (${m.sku}) — ${m.price.toLocaleString('fa-IR')} ${m.currency} — ${stock}`;
      });
      return `بر اساس کاتالوگ فروشگاه:\n${lines.join('\n')}`;
    } catch {
      return 'الان اطلاعات مطمئنی ندارم.';
    }
  }
}
