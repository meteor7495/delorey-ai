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
      const key = this.config.get<string>('OPENAI_API_KEY');
      if (!key) {
        return { text: this.mockFromContext(input), mode: 'mock' };
      }
    }
    return { text: this.mockFromContext(input), mode: 'mock' };
  }

  /**
   * Deterministic grounded reply — only uses facts in CONTEXT_JSON (catalog + knowledge).
   */
  private mockFromContext(input: CompleteInput): string {
    const block = input.system.match(/CONTEXT_JSON:([\s\S]*)$/);
    if (!block?.[1]) {
      return 'الان اطلاعات مطمئنی ندارم؛ لطفاً بعداً دوباره بپرسید یا با پشتیبانی فروشگاه صحبت کنید.';
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
        knowledge?: Array<{
          title: string;
          body: string;
          sourceAttribution: string;
        }>;
      };
      if (ctx.syncHealth && ctx.syncHealth !== 'healthy') {
        return 'همگام‌سازی فروشگاه سالم نیست؛ نمی‌توانم قیمت یا موجودی را با اطمینان بگویم.';
      }

      const knowledge = ctx.knowledge ?? [];
      const matches = ctx.matches ?? [];

      if (knowledge.length > 0 && matches.length === 0) {
        const lines = knowledge.slice(0, 3).map((k) => {
          return `• ${k.title}: ${k.body}\n  منبع: ${k.sourceAttribution}`;
        });
        return `بر اساس دانش فروشگاه:\n${lines.join('\n')}`;
      }

      if (knowledge.length > 0 && matches.length > 0) {
        const kLines = knowledge.slice(0, 2).map((k) => {
          return `• ${k.title}: ${k.body}\n  منبع: ${k.sourceAttribution}`;
        });
        const pLines = matches.slice(0, 2).map((m) => {
          const stock = m.inStock ? 'موجود' : 'ناموجود';
          return `• ${m.title} (${m.sku}) — ${m.price.toLocaleString('fa-IR')} ${m.currency} — ${stock}`;
        });
        return `بر اساس دانش و کاتالوگ فروشگاه:\n${kLines.join('\n')}\n${pLines.join('\n')}`;
      }

      if (matches.length === 0) {
        return 'این مورد را در کاتالوگ یا دانش فروشگاه پیدا نکردم. اگر نام دقیق‌تری بدهید دوباره جستجو می‌کنم.';
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
