import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../platform/prisma.service';
import { WalletService } from './wallet.service';
import { UsageBillingService } from './usage.service';
import { PricingEngine } from './pricing.engine';
import { AutoRechargeService } from './auto-recharge.service';
import { BILLING_CURRENCY } from './domain/billing.types';
import { toIrt } from './domain/money';

@Injectable()
export class AdminBillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly usage: UsageBillingService,
    private readonly pricing: PricingEngine,
    private readonly autoRecharge: AutoRechargeService,
  ) {}

  async tenantOverview(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('تنانت پیدا نشد');
    const wallet = await this.wallets.snapshot(tenantId);
    const auto = await this.autoRecharge.getOrCreate(tenantId);
    const usage = await this.usage.adminList({ tenantId, limit: 20 });
    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        plan: tenant.plan,
        billingStatus: tenant.billingStatus,
      },
      wallet,
      autoRecharge: {
        enabled: auto.enabled,
        thresholdAmount: toIrt(auto.thresholdAmount),
        rechargeAmount: toIrt(auto.rechargeAmount),
        monthlyLimit: toIrt(auto.monthlyLimit),
        pausedReason: auto.pausedReason,
      },
      usage,
    };
  }

  async margins(opts: { tenantId?: string; from?: Date; to?: Date }) {
    return this.usage.adminList({
      tenantId: opts.tenantId,
      from: opts.from,
      to: opts.to,
      limit: 100,
    });
  }

  async transactions(opts: {
    tenantId?: string;
    limit?: number;
    offset?: number;
  }) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;
    const where = opts.tenantId ? { tenantId: opts.tenantId } : {};
    const [items, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return {
      total,
      items: items.map((t) => ({
        id: t.id,
        tenantId: t.tenantId,
        type: t.type,
        amount: toIrt(t.amount),
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    };
  }

  async failedPayments(limit = 50) {
    const items = await this.prisma.billingPayment.findMany({
      where: { status: 'failed' },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 200),
    });
    return items.map((p) => ({
      id: p.id,
      tenantId: p.tenantId,
      kind: p.kind,
      amount: toIrt(p.amount),
      provider: p.provider,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  async manualCredit(args: {
    tenantId: string;
    amount: number;
    description: string;
    actorUserId: string;
    idempotencyKey: string;
  }) {
    const amount = Math.trunc(args.amount);
    if (amount <= 0) throw new Error('amount');
    await this.wallets.getOrCreate(args.tenantId);
    const tx = await this.wallets.credit(args.tenantId, {
      type: 'MANUAL_ADJUSTMENT',
      amount,
      description: args.description || 'اعتبار دستی',
      referenceType: 'admin',
      referenceId: args.actorUserId,
      idempotencyKey: args.idempotencyKey,
    });
    await this.prisma.adminAuditEvent.create({
      data: {
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: 'billing.manual_credit',
        summary: `اعتبار دستی ${amount.toLocaleString('fa-IR')} تومان`,
        payload: { amount, currency: BILLING_CURRENCY },
      },
    });
    return tx;
  }

  async refund(args: {
    tenantId: string;
    amount: number;
    description: string;
    actorUserId: string;
    idempotencyKey: string;
    referenceId?: string;
  }) {
    const amount = Math.trunc(args.amount);
    if (amount <= 0) throw new Error('amount');
    const tx = await this.wallets.credit(args.tenantId, {
      type: 'REFUND',
      amount,
      description: args.description || 'بازگشت وجه',
      referenceType: 'admin_refund',
      referenceId: args.referenceId ?? args.actorUserId,
      idempotencyKey: args.idempotencyKey,
    });
    await this.prisma.adminAuditEvent.create({
      data: {
        tenantId: args.tenantId,
        actorUserId: args.actorUserId,
        action: 'billing.refund',
        summary: `بازگشت ${amount.toLocaleString('fa-IR')} تومان`,
        payload: { amount },
      },
    });
    return tx;
  }

  listPricing() {
    return this.prisma.pricingRule.findMany({
      orderBy: [{ service: 'asc' }, { unitType: 'asc' }],
    });
  }

  upsertPricing(input: Parameters<PricingEngine['upsertRule']>[0]) {
    return this.pricing.upsertRule(input);
  }
}
