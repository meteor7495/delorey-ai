import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { WalletService } from './wallet.service';
import { PricingEngine } from './pricing.engine';
import { BillingAlertService } from './billing-alerts.service';
import { AutoRechargeService } from './auto-recharge.service';
import {
  BillingUnavailableError,
  InsufficientCreditError,
  SpendingLimitExceededError,
} from './billing.errors';
import {
  BILLING_CURRENCY,
  SERVICE_LABELS_FA,
  type BillingServiceCode,
} from './domain/billing.types';
import {
  mapTaskClassToService,
  quoteUsage,
} from './domain/pricing';
import { tehranDayStart, tehranMonthStart, toIrt } from './domain/money';

export type ChargeUsageInput = {
  tenantId: string;
  service?: BillingServiceCode;
  provider: string;
  model: string;
  requestId: string;
  inputUnits: number;
  outputUnits: number;
  taskClass?: string;
  feature?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  /** When wallet was already captured via reservation */
  skipWallet?: boolean;
};

@Injectable()
export class UsageBillingService {
  private readonly log = new Logger(UsageBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly pricing: PricingEngine,
    private readonly alerts: BillingAlertService,
    private readonly autoRecharge: AutoRechargeService,
  ) {}

  async quote(input: {
    service: BillingServiceCode;
    provider: string;
    model: string;
    inputUnits: number;
    outputUnits: number;
  }) {
    const [inputRule, outputRule] = await Promise.all([
      this.pricing.findRule({
        service: input.service,
        provider: input.provider,
        model: input.model,
        unitType: 'input_token',
      }),
      this.pricing.findRule({
        service: input.service,
        provider: input.provider,
        model: input.model,
        unitType: 'output_token',
      }),
    ]);
    const requestRule = await this.pricing.findRule({
      service: input.service,
      provider: input.provider,
      model: input.model,
      unitType: input.service === 'IMAGE_GENERATION' ? 'image' : 'request',
    });
    return quoteUsage({
      inputUnits: input.inputUnits,
      outputUnits: input.outputUnits,
      inputRule,
      outputRule,
      requestRule,
    });
  }

  async monthUsageIrt(tenantId: string, now = new Date()): Promise<number> {
    const from = tehranMonthStart(now);
    const agg = await this.prisma.usageRecord.aggregate({
      where: { tenantId, createdAt: { gte: from } },
      _sum: { customerCharge: true },
    });
    return toIrt(agg._sum.customerCharge);
  }

  async dayUsageIrt(tenantId: string, now = new Date()): Promise<number> {
    const from = tehranDayStart(now);
    const agg = await this.prisma.usageRecord.aggregate({
      where: { tenantId, createdAt: { gte: from } },
      _sum: { customerCharge: true },
    });
    return toIrt(agg._sum.customerCharge);
  }

  async assertSpendAllowed(tenantId: string, charge: number) {
    if (charge <= 0) return;
    const wallet = await this.wallets.snapshot(tenantId);
    if (wallet.available < charge) {
      throw new InsufficientCreditError();
    }
    const limit = await this.prisma.spendingLimit.findUnique({
      where: { tenantId },
    });
    const monthlyLimit =
      limit?.monthlyLimit != null ? toIrt(limit.monthlyLimit) : null;
    if (monthlyLimit != null && monthlyLimit > 0) {
      const used = await this.monthUsageIrt(tenantId);
      if (used + charge > monthlyLimit) {
        throw new SpendingLimitExceededError();
      }
    }
  }

  async charge(input: ChargeUsageInput) {
    const existing = await this.prisma.usageRecord.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
    });
    if (existing) {
      if (existing.tenantId !== input.tenantId) {
        throw new BillingUnavailableError();
      }
      return existing;
    }

    const service: BillingServiceCode =
      input.service ??
      (input.taskClass
        ? mapTaskClassToService(input.taskClass)
        : 'AI_CHAT');

    const quote = await this.quote({
      service,
      provider: input.provider,
      model: input.model,
      inputUnits: input.inputUnits,
      outputUnits: input.outputUnits,
    });

    if (quote.customerCharge <= 0) {
      const wallet = await this.wallets.getOrCreate(input.tenantId);
      try {
        return await this.prisma.usageRecord.create({
          data: {
            tenantId: input.tenantId,
            walletId: wallet.id,
            service,
            provider: input.provider,
            model: input.model,
            requestId: input.requestId,
            inputUnits: input.inputUnits,
            outputUnits: input.outputUnits,
            totalUnits: input.inputUnits + input.outputUnits,
            unitType: 'token',
            providerCost: new Prisma.Decimal(quote.providerCost),
            customerCharge: 0,
            currency: BILLING_CURRENCY,
            idempotencyKey: input.idempotencyKey,
            metadata: (input.metadata ?? undefined) as
              | Prisma.InputJsonValue
              | undefined,
          },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          return this.prisma.usageRecord.findUniqueOrThrow({
            where: { idempotencyKey: input.idempotencyKey },
          });
        }
        throw err;
      }
    }

    if (!input.skipWallet) {
      await this.assertSpendAllowed(input.tenantId, quote.customerCharge);
      await this.wallets.debit(input.tenantId, {
        type: 'USAGE',
        amount: quote.customerCharge,
        description: SERVICE_LABELS_FA[service],
        referenceType: 'usage',
        referenceId: input.requestId,
        idempotencyKey: `ledger:${input.idempotencyKey}`,
        metadata: {
          service,
          provider: input.provider,
          model: input.model,
          providerCost: quote.providerCost,
          markup: quote.markup,
        },
      });
    }

    const wallet = await this.wallets.getOrCreate(input.tenantId);
    try {
      return await this.prisma.usageRecord.create({
        data: {
          tenantId: input.tenantId,
          walletId: wallet.id,
          service,
          provider: input.provider,
          model: input.model,
          requestId: input.requestId,
          inputUnits: input.inputUnits,
          outputUnits: input.outputUnits,
          totalUnits: input.inputUnits + input.outputUnits,
          unitType: 'token',
          providerCost: new Prisma.Decimal(quote.providerCost),
          customerCharge: quote.customerCharge,
          currency: BILLING_CURRENCY,
          idempotencyKey: input.idempotencyKey,
          metadata: {
            markup: quote.markup,
            feature: input.feature,
            ...(input.metadata ?? {}),
          } as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        return this.prisma.usageRecord.findUniqueOrThrow({
          where: { idempotencyKey: input.idempotencyKey },
        });
      }
      this.log.error(
        `usage record failed after debit tenant=${input.tenantId}: ${err instanceof Error ? err.message : err}`,
      );
      throw new BillingUnavailableError();
    } finally {
      void this.afterDebit(input.tenantId);
    }
  }

  private async afterDebit(tenantId: string) {
    try {
      await this.alerts.afterBalanceChange(tenantId);
      await this.autoRecharge.maybeTrigger(tenantId);
    } catch {
      /* debit already committed */
    }
  }

  async summarize(tenantId: string) {
    const now = new Date();
    const dayStart = tehranDayStart(now);
    const monthStart = tehranMonthStart(now);
    const [today, month, breakdown, recent] = await Promise.all([
      this.prisma.usageRecord.aggregate({
        where: { tenantId, createdAt: { gte: dayStart } },
        _sum: { customerCharge: true },
      }),
      this.prisma.usageRecord.aggregate({
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { customerCharge: true },
      }),
      this.prisma.usageRecord.groupBy({
        by: ['service'],
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { customerCharge: true },
      }),
      this.prisma.usageRecord.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          service: true,
          createdAt: true,
          customerCharge: true,
          currency: true,
        },
      }),
    ]);

    return {
      currency: BILLING_CURRENCY,
      currencyLabel: 'تومان',
      today: toIrt(today._sum.customerCharge),
      thisMonth: toIrt(month._sum.customerCharge),
      breakdown: breakdown.map((b) => ({
        service: b.service,
        label:
          SERVICE_LABELS_FA[b.service as BillingServiceCode] ?? b.service,
        amount: toIrt(b._sum.customerCharge),
      })),
      items: recent.map((r) => ({
        id: r.id,
        date: r.createdAt.toISOString(),
        service: r.service,
        label:
          SERVICE_LABELS_FA[r.service as BillingServiceCode] ?? r.service,
        cost: toIrt(r.customerCharge),
        currency: r.currency,
      })),
    };
  }

  async adminList(opts: {
    tenantId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.UsageRecordWhereInput = {
      ...(opts.tenantId ? { tenantId: opts.tenantId } : {}),
      ...(opts.from || opts.to
        ? {
            createdAt: {
              ...(opts.from ? { gte: opts.from } : {}),
              ...(opts.to ? { lt: opts.to } : {}),
            },
          }
        : {}),
    };
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;
    const [items, total, sums] = await Promise.all([
      this.prisma.usageRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.usageRecord.count({ where }),
      this.prisma.usageRecord.aggregate({
        where,
        _sum: { providerCost: true, customerCharge: true },
      }),
    ]);
    const providerCost = Number(sums._sum.providerCost ?? 0);
    const customerCharge = toIrt(sums._sum.customerCharge);
    return {
      total,
      limit,
      offset,
      providerCost,
      customerCharge,
      grossMargin: customerCharge - providerCost,
      items: items.map((r) => ({
        id: r.id,
        tenantId: r.tenantId,
        service: r.service,
        provider: r.provider,
        model: r.model,
        inputUnits: Number(r.inputUnits),
        outputUnits: Number(r.outputUnits),
        providerCost: Number(r.providerCost),
        customerCharge: toIrt(r.customerCharge),
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
