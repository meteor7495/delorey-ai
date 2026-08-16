import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../platform/prisma.service';
import {
  PROVIDER_PRESETS,
  parseProviderId,
  resolveProviderConfig,
  type GatewayProviderId,
} from '../provider-presets';

/**
 * Upserts default ai_model_bindings from env/presets on boot.
 * Does not overwrite manually edited upstream models when AI_GATEWAY_BINDINGS_FORCE=0 (default).
 * Set AI_GATEWAY_BINDINGS_FORCE=1 to re-sync from env.
 */
@Injectable()
export class ModelBindingBootstrap implements OnModuleInit {
  private readonly log = new Logger(ModelBindingBootstrap.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const force =
      (this.config.get<string>('AI_GATEWAY_BINDINGS_FORCE') ?? '0') === '1';
    const get = (key: string) => this.config.get<string>(key);
    const primary = parseProviderId(get('AI_GATEWAY_PROVIDER'));
    const ids = unique([
      primary,
      'openai',
      'gapgpt',
      'ninerouter',
      'boxapi',
      'liara',
      'custom',
    ] as GatewayProviderId[]);

    let upserted = 0;
    for (const providerId of ids) {
      if (providerId === 'mock') continue;
      const resolved = resolveProviderConfig(get, providerId);
      if ('missingReason' in resolved) continue;
      const preset = PROVIDER_PRESETS[providerId];

      for (const tier of ['cheap', 'premium'] as const) {
        const upstream =
          tier === 'cheap' ? resolved.modelCheap : resolved.modelPremium;
        const internalModelId = `seloma.${providerId}.${tier}.v1`;
        const legacyModelId = `delorey.${providerId}.${tier}.v1`;
        const pricePrompt =
          preset.pricePromptPer1k != null
            ? new Prisma.Decimal(preset.pricePromptPer1k)
            : undefined;
        const priceCompletion =
          preset.priceCompletionPer1k != null
            ? new Prisma.Decimal(preset.priceCompletionPer1k)
            : undefined;

        try {
          const existing =
            (await this.prisma.aiModelBinding.findUnique({
              where: { internalModelId },
            })) ??
            (await this.prisma.aiModelBinding.findUnique({
              where: { internalModelId: legacyModelId },
            }));
          if (existing && !force) continue;

          await this.prisma.aiModelBinding.upsert({
            where: { internalModelId: existing?.internalModelId ?? internalModelId },
            create: {
              internalModelId,
              providerId,
              upstreamModel: upstream,
              taskClasses: [
                tier === 'cheap' ? 'chat.reply.cheap' : 'chat.reply.premium',
                'chat.classify',
                'chat.compress',
              ],
              costTier: tier,
              enabled: true,
              pricePromptPer1k: pricePrompt,
              priceCompletionPer1k: priceCompletion,
              metadata: { source: 'bootstrap', providerId },
            },
            update: force
              ? {
                  upstreamModel: upstream,
                  enabled: true,
                  pricePromptPer1k: pricePrompt,
                  priceCompletionPer1k: priceCompletion,
                  metadata: { source: 'bootstrap', providerId, forced: true },
                }
              : {},
          });
          upserted += 1;
        } catch (err) {
          this.log.warn(
            `binding bootstrap failed ${internalModelId}: ${
              err instanceof Error ? err.message : 'unknown'
            }`,
          );
        }
      }
    }
    if (upserted > 0) {
      this.log.log(`ai_model_bindings bootstrap upserted=${upserted}`);
    }
  }
}

function unique<T>(ids: T[]): T[] {
  return ids.filter((id, i, arr) => arr.indexOf(id) === i);
}
