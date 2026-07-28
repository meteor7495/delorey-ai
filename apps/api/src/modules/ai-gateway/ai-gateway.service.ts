import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GatewayError } from './gateway-errors';
import { OpenAiCompatibleChatPlugin } from './plugins/openai-compatible.plugin';
import { resolveProviderConfig } from './provider-presets';
import type {
  ChatProviderPlugin,
  RouteHint,
  TaskClass,
} from './provider-plugin';

export type CompleteInput = {
  system: string;
  user: string;
  tenantId: string;
  taskClass?: TaskClass;
  routeHint?: RouteHint;
};

export type GatewayMeter = {
  mode: 'mock' | 'live';
  providerId: string;
  modelId: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  taskClass: TaskClass;
  routeHint: RouteHint;
  fallbackReason?: string;
};

export type CompleteResult = {
  text: string;
  mode: 'mock' | 'live';
  meter: GatewayMeter;
};

@Injectable()
export class AiGatewayService {
  private readonly log = new Logger(AiGatewayService.name);

  constructor(private readonly config: ConfigService) {}

  async complete(input: CompleteInput): Promise<CompleteResult> {
    const taskClass: TaskClass = input.taskClass ?? 'chat.reply.cheap';
    const routeHint: RouteHint =
      input.routeHint ??
      (taskClass === 'chat.reply.premium' ? 'premium' : 'cheap');
    const mode = (
      this.config.get<string>('AI_GATEWAY_MODE') ?? 'mock'
    ).toLowerCase();

    if (mode === 'live') {
      const built = this.buildLivePlugin();
      if ('plugin' in built) {
        try {
          const res = await built.plugin.complete({
            tenantId: input.tenantId,
            system: input.system,
            user: input.user,
            taskClass,
            routeHint,
          });
          const meter: GatewayMeter = {
            mode: 'live',
            providerId: res.providerId,
            modelId: res.modelId,
            tokensIn: res.usage.tokensIn,
            tokensOut: res.usage.tokensOut,
            latencyMs: res.latencyMs,
            taskClass,
            routeHint,
          };
          this.logMeter(input.tenantId, meter);
          return { text: res.text, mode: 'live', meter };
        } catch (err) {
          const reason =
            err instanceof GatewayError
              ? `${err.code}:${err.message}`
              : err instanceof Error
                ? err.message
                : 'unknown';
          this.log.warn(
            `Live complete failed; falling back to grounded mock tenant=${input.tenantId} reason=${reason}`,
          );
          const text = this.mockFromContext(input);
          const meter: GatewayMeter = {
            mode: 'mock',
            providerId: 'mock',
            modelId: 'grounded-template',
            tokensIn: 0,
            tokensOut: 0,
            latencyMs: 0,
            taskClass,
            routeHint,
            fallbackReason: reason.slice(0, 240),
          };
          this.logMeter(input.tenantId, meter);
          return { text, mode: 'mock', meter };
        }
      }
      this.log.warn(
        `AI_GATEWAY_MODE=live but ${built.missingReason}; using mock tenant=${input.tenantId}`,
      );
      const started = Date.now();
      const text = this.mockFromContext(input);
      const meter: GatewayMeter = {
        mode: 'mock',
        providerId: 'mock',
        modelId: 'grounded-template',
        tokensIn: 0,
        tokensOut: 0,
        latencyMs: Date.now() - started,
        taskClass,
        routeHint,
        fallbackReason: built.missingReason,
      };
      this.logMeter(input.tenantId, meter);
      return { text, mode: 'mock', meter };
    }

    const started = Date.now();
    const text = this.mockFromContext(input);
    const meter: GatewayMeter = {
      mode: 'mock',
      providerId: 'mock',
      modelId: 'grounded-template',
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: Date.now() - started,
      taskClass,
      routeHint,
    };
    this.logMeter(input.tenantId, meter);
    return { text, mode: 'mock', meter };
  }

  private buildLivePlugin():
    | { plugin: ChatProviderPlugin }
    | { missingReason: string } {
    const resolved = resolveProviderConfig((key) =>
      this.config.get<string>(key),
    );
    if ('missingReason' in resolved) {
      return { missingReason: resolved.missingReason };
    }
    return {
      plugin: new OpenAiCompatibleChatPlugin(resolved),
    };
  }

  private logMeter(tenantId: string, meter: GatewayMeter) {
    this.log.log(
      `gateway.complete tenant=${tenantId} mode=${meter.mode} provider=${meter.providerId} model=${meter.modelId} in=${meter.tokensIn} out=${meter.tokensOut} ms=${meter.latencyMs} task=${meter.taskClass}${
        meter.fallbackReason ? ` fallback=${meter.fallbackReason}` : ''
      }`,
    );
  }

  /**
   * Deterministic grounded reply — only uses facts in CONTEXT_JSON (catalog + knowledge).
   */
  private mockFromContext(input: { system: string; user: string }): string {
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
