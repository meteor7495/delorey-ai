import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { GatewayError } from './domain/gateway-errors';
import type { GenerateResponse } from './domain/provider.port';
import type { RouteHint, TaskClass } from './domain/routing.types';
import { RouterService } from './application/router.service';
import { CircuitBreakerService } from './infrastructure/circuit-breaker.redis';
import { UsageLedgerService } from './infrastructure/persistence/usage-ledger.service';
import { UsageBillingService } from '../billing/usage.service';
import { ReservationService } from '../billing/reservation.service';
import { isBillingUserError } from '../billing/billing.errors';
import { BillingUnavailableError } from '../billing/billing.errors';
import {
  estimateInputTokens,
  mapTaskClassToService,
} from '../billing/domain/pricing';
import { SERVICE_LABELS_FA } from '../billing/domain/billing.types';

export type CompleteInput = {
  system: string;
  user: string;
  tenantId: string;
  taskClass?: TaskClass;
  routeHint?: RouteHint;
  feature?: string;
  conversationId?: string;
  maxTokens?: number;
  temperature?: number;
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
  retryCount?: number;
  fallbackCount?: number;
  costUsd?: number;
  cacheHit?: boolean;
  fallbackReason?: string;
};

export type CompleteResult = {
  text: string;
  mode: 'mock' | 'live';
  meter: GatewayMeter;
};

/**
 * AI Gateway façade — single entry point for Runtime / Cost / Knowledge.
 * Provider Layer adapters (incl. 9Router) sit behind the Router.
 */
@Injectable()
export class AiGatewayService {
  private readonly log = new Logger(AiGatewayService.name);

  constructor(
    private readonly router: RouterService,
    private readonly circuits: CircuitBreakerService,
    private readonly ledger: UsageLedgerService,
    private readonly usageBilling: UsageBillingService,
    private readonly reservations: ReservationService,
  ) {}

  async complete(input: CompleteInput): Promise<CompleteResult> {
    const taskClass: TaskClass = input.taskClass ?? 'chat.reply.cheap';
    const routeHint: RouteHint =
      input.routeHint ??
      (taskClass === 'chat.reply.premium' ? 'premium' : 'cheap');

    const decision = await this.router.decide({
      tenantId: input.tenantId,
      taskClass,
      routeHint,
    });

    const chain = [decision.primary, ...decision.fallbacks];
    let retryCount = 0;
    let fallbackCount = 0;
    let lastReason: string | undefined;
    if (decision.rejectReason) {
      lastReason = decision.rejectReason;
    }

    const billingRequestId = randomUUID();
    let reservationId: string | null = null;
    const livePrimary = decision.primary.providerId !== 'mock';
    if (livePrimary) {
      reservationId = await this.reserveForLive(input, decision.primary, billingRequestId);
    }

    for (let i = 0; i < chain.length; i++) {
      const candidate = chain[i]!;
      const provider = this.router.resolveProvider(candidate.providerId);
      if (!provider) {
        lastReason = `provider_missing:${candidate.providerId}`;
        continue;
      }

      try {
        const res = await provider.generate({
          tenantId: input.tenantId,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
          modelId: candidate.modelId,
          maxTokens: input.maxTokens,
          temperature: input.temperature,
          timeoutMs: decision.timeoutMs,
          taskClass,
          routeHint,
        });

        await this.circuits.recordSuccess(candidate.providerId);

        const mode: 'mock' | 'live' =
          res.providerId === 'mock' ? 'mock' : 'live';
        const meter = this.toMeter({
          res,
          mode,
          taskClass,
          routeHint,
          retryCount,
          fallbackCount,
          fallbackReason:
            i > 0 || lastReason
              ? (lastReason ?? `fallback_to:${res.providerId}`).slice(0, 240)
              : undefined,
        });
        this.logMeter(input.tenantId, meter);
        await this.ledger.record({
          tenantId: input.tenantId,
          conversationId: input.conversationId,
          feature: input.feature ?? 'sales_reply',
          taskClass,
          routeHint,
          providerId: meter.providerId,
          modelId: meter.modelId,
          latencyMs: meter.latencyMs,
          promptTokens: meter.tokensIn,
          completionTokens: meter.tokensOut,
          costUsd: meter.costUsd,
          retryCount,
          fallbackCount,
          cacheHit: false,
        });
        if (mode === 'live' && reservationId) {
          await this.settleLiveUsage({
            input,
            meter,
            billingRequestId,
            reservationId,
            taskClass,
          });
        } else if (reservationId) {
          await this.reservations
            .release({
              tenantId: input.tenantId,
              reservationId,
              idempotencyKey: `reserve-release:${billingRequestId}`,
            })
            .catch(() => undefined);
        }
        return {
          text: res.text?.trim() || '',
          mode,
          meter,
        };
      } catch (err) {
        if (isBillingUserError(err) || err instanceof BillingUnavailableError) {
          throw err;
        }
        const reason =
          err instanceof GatewayError
            ? `${err.code}:${err.message}`
            : err instanceof Error
              ? err.message
              : 'unknown';
        lastReason = reason.slice(0, 240);

        await this.circuits.recordFailure(candidate.providerId);
        await this.ledger.record({
          tenantId: input.tenantId,
          conversationId: input.conversationId,
          feature: input.feature ?? 'sales_reply',
          taskClass,
          routeHint,
          providerId: candidate.providerId,
          modelId: candidate.modelId,
          latencyMs: 0,
          promptTokens: 0,
          completionTokens: 0,
          retryCount,
          fallbackCount,
          errorCode:
            err instanceof GatewayError ? err.code : 'unavailable',
        });

        const retryable =
          err instanceof GatewayError ? err.retryable : true;

        if (retryable && i === 0 && retryCount < 1) {
          retryCount += 1;
          i -= 1;
          continue;
        }

        if (i < chain.length - 1) {
          fallbackCount += 1;
          this.log.warn(
            `Provider ${candidate.providerId} failed; failover tenant=${input.tenantId} reason=${lastReason}`,
          );
        }
      }
    }

    if (reservationId) {
      await this.reservations
        .release({
          tenantId: input.tenantId,
          reservationId,
          idempotencyKey: `reserve-release:${billingRequestId}`,
        })
        .catch(() => undefined);
    }

    const mock = this.router.resolveProvider('mock');
    const res = mock
      ? await mock.generate({
          tenantId: input.tenantId,
          messages: [
            { role: 'system', content: input.system },
            { role: 'user', content: input.user },
          ],
          modelId: 'grounded-template',
          timeoutMs: decision.timeoutMs,
          taskClass,
          routeHint,
        })
      : ({
          text: 'الان اطلاعات مطمئنی ندارم.',
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          providerId: 'mock',
          modelId: 'grounded-template',
          latencyMs: 0,
        } satisfies GenerateResponse);

    const meter = this.toMeter({
      res,
      mode: 'mock',
      taskClass,
      routeHint,
      retryCount,
      fallbackCount,
      fallbackReason: (lastReason ?? 'all_providers_failed').slice(0, 240),
    });
    this.logMeter(input.tenantId, meter);
    await this.ledger.record({
      tenantId: input.tenantId,
      conversationId: input.conversationId,
      feature: input.feature ?? 'sales_reply',
      taskClass,
      routeHint,
      providerId: meter.providerId,
      modelId: meter.modelId,
      latencyMs: meter.latencyMs,
      promptTokens: meter.tokensIn,
      completionTokens: meter.tokensOut,
      costUsd: 0,
      retryCount,
      fallbackCount,
    });
    return { text: res.text?.trim() || '', mode: 'mock', meter };
  }

  private async reserveForLive(
    input: CompleteInput,
    candidate: { providerId: string; modelId: string },
    billingRequestId: string,
  ): Promise<string> {
    const service = mapTaskClassToService(input.taskClass ?? 'chat.reply.cheap');
    const quote = await this.usageBilling.quote({
      service,
      provider: candidate.providerId,
      model: candidate.modelId,
      inputUnits: estimateInputTokens(input.system, input.user),
      outputUnits: input.maxTokens ?? 512,
    });
    const amount = Math.max(1, quote.customerCharge);
    await this.usageBilling.assertSpendAllowed(input.tenantId, amount);
    const reserved = await this.reservations.reserve({
      tenantId: input.tenantId,
      amount,
      referenceId: billingRequestId,
      idempotencyKey: `reserve:${input.tenantId}:${billingRequestId}`,
    });
    return reserved.id;
  }

  private async settleLiveUsage(args: {
    input: CompleteInput;
    meter: GatewayMeter;
    billingRequestId: string;
    reservationId: string;
    taskClass: TaskClass;
  }) {
    const service = mapTaskClassToService(args.taskClass);
    const quote = await this.usageBilling.quote({
      service,
      provider: args.meter.providerId,
      model: args.meter.modelId,
      inputUnits: args.meter.tokensIn,
      outputUnits: args.meter.tokensOut,
    });
    try {
      await this.reservations.capture({
        tenantId: args.input.tenantId,
        reservationId: args.reservationId,
        actualCharge: quote.customerCharge,
        description: SERVICE_LABELS_FA[service],
        usageIdempotencyKey: `ledger:usage:${args.input.tenantId}:${args.billingRequestId}`,
      });
      await this.usageBilling.charge({
        tenantId: args.input.tenantId,
        service,
        provider: args.meter.providerId,
        model: args.meter.modelId,
        requestId: args.billingRequestId,
        inputUnits: args.meter.tokensIn,
        outputUnits: args.meter.tokensOut,
        taskClass: args.taskClass,
        feature: args.input.feature,
        idempotencyKey: `usage:${args.input.tenantId}:${args.billingRequestId}`,
        skipWallet: true,
      });
    } catch (err) {
      this.log.error(
        `billing settle failed tenant=${args.input.tenantId}: ${err instanceof Error ? err.message : err}`,
      );
      if (isBillingUserError(err) || err instanceof BillingUnavailableError) {
        throw err;
      }
      throw new BillingUnavailableError();
    }
  }

  private toMeter(args: {
    res: GenerateResponse;
    mode: 'mock' | 'live';
    taskClass: TaskClass;
    routeHint: RouteHint;
    retryCount: number;
    fallbackCount: number;
    fallbackReason?: string;
  }): GatewayMeter {
    return {
      mode: args.mode,
      providerId: args.res.providerId,
      modelId: args.res.modelId,
      tokensIn: args.res.usage.promptTokens,
      tokensOut: args.res.usage.completionTokens,
      latencyMs: args.res.latencyMs,
      taskClass: args.taskClass,
      routeHint: args.routeHint,
      retryCount: args.retryCount,
      fallbackCount: args.fallbackCount,
      costUsd: args.res.rawCost?.amount,
      cacheHit: false,
      fallbackReason: args.fallbackReason,
    };
  }

  private logMeter(tenantId: string, meter: GatewayMeter) {
    this.log.log(
      `gateway.complete tenant=${tenantId} mode=${meter.mode} provider=${meter.providerId} model=${meter.modelId} in=${meter.tokensIn} out=${meter.tokensOut} ms=${meter.latencyMs} task=${meter.taskClass} retries=${meter.retryCount ?? 0} fallbacks=${meter.fallbackCount ?? 0}${
        meter.fallbackReason ? ` fallback=${meter.fallbackReason}` : ''
      }`,
    );
  }
}
