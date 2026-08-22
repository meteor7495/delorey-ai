import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../platform/prisma.service';
import { WalletService } from './wallet.service';
import { UsageBillingService } from './usage.service';
import { AutoRechargeService } from './auto-recharge.service';
import { BillingPaymentService } from './billing-payment.service';
import { BillingAlertService } from './billing-alerts.service';
import { ReservationService } from './reservation.service';
import {
  BILLING_CURRENCY,
  BILLING_CURRENCY_LABEL,
  WALLET_TX_TYPES,
} from './domain/billing.types';
import { toIrt } from './domain/money';
import { isBillingUserError } from './billing.errors';

const TX_LABELS: Record<string, string> = {
  CREDIT_PURCHASE: 'خرید اعتبار',
  SUBSCRIPTION_CREDIT: 'اعتبار اشتراک',
  USAGE: 'مصرف هوش مصنوعی',
  REFUND: 'بازگشت وجه',
  MANUAL_ADJUSTMENT: 'تعدیل دستی',
  AUTO_RECHARGE: 'شارژ خودکار',
  BONUS: 'اعتبار هدیه',
  EXPIRATION: 'انقضای اعتبار',
  RESERVATION: 'رزرو اعتبار',
  RESERVATION_CAPTURE: 'برداشت رزرو',
  RESERVATION_RELEASE: 'آزادسازی رزرو',
};

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly usage: UsageBillingService,
    private readonly autoRecharge: AutoRechargeService,
    private readonly payments: BillingPaymentService,
    private readonly alerts: BillingAlertService,
    private readonly reservations: ReservationService,
    private readonly config: ConfigService,
  ) {}

  isPlatformAdmin(email: string | undefined | null): boolean {
    const list = (this.config.get<string>('PLATFORM_ADMIN_EMAILS') ?? '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (!email) return false;
    return list.includes(email.trim().toLowerCase());
  }

  async walletDashboard(tenantId: string, email?: string) {
    await this.reservations.expireDue(tenantId);
    const wallet = await this.wallets.snapshot(tenantId);
    const [monthUsage, auto, limit, packs] = await Promise.all([
      this.usage.monthUsageIrt(tenantId),
      this.autoRecharge.getOrCreate(tenantId),
      this.getSpendingLimit(tenantId),
      this.payments.listPacks(),
    ]);
    const monthRecharged = await this.alerts.monthAutoRechargeTotal(tenantId);
    const estimatedRemaining =
      limit.monthlyLimit != null
        ? Math.max(0, limit.monthlyLimit - monthUsage)
        : wallet.available;

    return {
      currency: BILLING_CURRENCY,
      currencyLabel: BILLING_CURRENCY_LABEL,
      tagline: 'فقط به اندازه‌ای که استفاده می‌کنید هزینه می‌پردازید — و کنترل کامل هزینه با شماست.',
      balance: wallet.balance,
      reserved: wallet.reserved,
      available: wallet.available,
      status: wallet.status,
      monthUsage,
      estimatedRemaining,
      lowBalance: wallet.available <= wallet.lowBalanceThreshold,
      criticalBalance: wallet.available <= wallet.criticalBalanceThreshold,
      spendingLimit: limit,
      autoRecharge: {
        enabled: auto.enabled,
        thresholdAmount: toIrt(auto.thresholdAmount),
        rechargeAmount: toIrt(auto.rechargeAmount),
        monthlyLimit: toIrt(auto.monthlyLimit),
        monthRecharged,
        pausedReason: auto.pausedReason,
        cooldownUntil: auto.cooldownUntil?.toISOString() ?? null,
      },
      packs: packs.map((p) => ({
        id: p.id,
        slug: p.slug,
        amount: toIrt(p.amount),
        label: p.label,
      })),
      isPlatformAdmin: this.isPlatformAdmin(email),
    };
  }

  async getSpendingLimit(tenantId: string) {
    const wallet = await this.wallets.getOrCreate(tenantId);
    let row = await this.prisma.spendingLimit.findUnique({
      where: { tenantId },
    });
    if (!row) {
      row = await this.prisma.spendingLimit.create({
        data: { walletId: wallet.id, tenantId, monthlyLimit: null },
      });
    }
    const monthUsage = await this.usage.monthUsageIrt(tenantId);
    const monthlyLimit =
      row.monthlyLimit != null ? toIrt(row.monthlyLimit) : null;
    return {
      monthlyLimit,
      monthUsage,
      remaining:
        monthlyLimit != null ? Math.max(0, monthlyLimit - monthUsage) : null,
      restricted: monthlyLimit != null && monthUsage >= monthlyLimit,
    };
  }

  async updateSpendingLimit(tenantId: string, monthlyLimit: number | null) {
    const wallet = await this.wallets.getOrCreate(tenantId);
    const value =
      monthlyLimit == null || monthlyLimit <= 0 ? null : Math.trunc(monthlyLimit);
    await this.prisma.spendingLimit.upsert({
      where: { tenantId },
      create: { walletId: wallet.id, tenantId, monthlyLimit: value },
      update: { monthlyLimit: value },
    });
    return this.getSpendingLimit(tenantId);
  }

  async transactions(
    tenantId: string,
    opts: { limit?: number; offset?: number; type?: string },
  ) {
    const limit = Math.min(opts.limit ?? 50, 200);
    const offset = opts.offset ?? 0;
    const type =
      opts.type && WALLET_TX_TYPES.includes(opts.type as never)
        ? opts.type
        : undefined;
    const where = {
      tenantId,
      ...(type
        ? { type }
        : { type: { notIn: ['RESERVATION', 'RESERVATION_RELEASE'] } }),
    };
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
      limit,
      offset,
      currency: BILLING_CURRENCY,
      currencyLabel: BILLING_CURRENCY_LABEL,
      items: items.map((t) => ({
        id: t.id,
        date: t.createdAt.toISOString(),
        type: t.type,
        label: TX_LABELS[t.type] ?? t.type,
        amount: toIrt(t.amount),
        description: t.description,
      })),
    };
  }

  async purchase(tenantId: string, packId: string, idempotencyKey?: string) {
    const started = await this.payments.startPurchase(
      tenantId,
      packId,
      idempotencyKey,
    );
    return {
      paymentId: started.payment.id,
      amount: toIrt(started.payment.amount),
      currency: BILLING_CURRENCY,
      payUrl: started.payUrl,
      status: started.payment.status,
      alreadyPaid: started.alreadyPaid,
    };
  }

  async grantSubscriptionCredit(tenantId: string, plan: string, referenceId: string) {
    const grant = await this.prisma.subscriptionCreditGrant.findUnique({
      where: { plan },
    });
    if (!grant || grant.status !== 'active') return null;
    const amount = toIrt(grant.includedCredit);
    if (amount <= 0) return null;
    return this.wallets.credit(tenantId, {
      type: 'SUBSCRIPTION_CREDIT',
      amount,
      description: `اعتبار اشتراک ${plan}`,
      referenceType: 'subscription',
      referenceId,
      idempotencyKey: `subscription-credit:${tenantId}:${plan}:${referenceId}`,
    });
  }

  async onDebitSideEffects(tenantId: string) {
    try {
      await this.alerts.afterBalanceChange(tenantId);
      await this.autoRecharge.maybeTrigger(tenantId);
    } catch (err) {
      if (isBillingUserError(err)) return;
      // Side effects must not reverse a successful debit.
    }
  }
}
