import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../platform/prisma.service';
import { RedisLockService } from '../platform/redis-lock.service';
import { WalletService } from './wallet.service';
import { BillingAlertService } from './billing-alerts.service';
import { BillingPaymentService } from './billing-payment.service';
import { shouldTriggerAutoRecharge, monthlyCapExceeded } from './domain/pricing';
import { tehranMonthKey, tehranMonthStart, toIrt } from './domain/money';

@Injectable()
export class AutoRechargeService {
  private readonly log = new Logger(AutoRechargeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly alerts: BillingAlertService,
    private readonly payments: BillingPaymentService,
    private readonly locks: RedisLockService,
  ) {}

  async getOrCreate(tenantId: string) {
    const wallet = await this.wallets.getOrCreate(tenantId);
    const existing = await this.prisma.autoRechargeConfig.findUnique({
      where: { tenantId },
    });
    if (existing) return existing;
    return this.prisma.autoRechargeConfig.create({
      data: {
        walletId: wallet.id,
        tenantId,
        enabled: false,
        thresholdAmount: 200_000,
        rechargeAmount: 1_000_000,
        monthlyLimit: 3_000_000,
        paymentMethodId: this.payments.merchantId() ? 'zarinpal' : 'mock',
      },
    });
  }

  async update(
    tenantId: string,
    patch: {
      enabled?: boolean;
      thresholdAmount?: number;
      rechargeAmount?: number;
      monthlyLimit?: number;
    },
  ) {
    const current = await this.getOrCreate(tenantId);
    return this.prisma.autoRechargeConfig.update({
      where: { id: current.id },
      data: {
        enabled: patch.enabled ?? current.enabled,
        thresholdAmount: patch.thresholdAmount ?? current.thresholdAmount,
        rechargeAmount: patch.rechargeAmount ?? current.rechargeAmount,
        monthlyLimit: patch.monthlyLimit ?? current.monthlyLimit,
        pausedReason: patch.enabled === true ? null : current.pausedReason,
      },
    });
  }

  async maybeTrigger(tenantId: string): Promise<{
    triggered: boolean;
    status?: string;
    payUrl?: string | null;
    reason?: string;
  }> {
    const key = `t:${tenantId}:lock:auto-recharge`;
    return this.locks.withLock(key, () => this.runLocked(tenantId));
  }

  private async runLocked(tenantId: string) {
    const config = await this.getOrCreate(tenantId);
    const wallet = await this.wallets.snapshot(tenantId);
    const eligible = shouldTriggerAutoRecharge({
      enabled: config.enabled,
      pausedReason: config.pausedReason,
      available: wallet.available,
      threshold: toIrt(config.thresholdAmount),
      cooldownUntil: config.cooldownUntil,
    });
    if (!eligible) {
      return { triggered: false, reason: 'not_eligible' };
    }

    const monthTotal = await this.alerts.monthAutoRechargeTotal(tenantId);
    const recharge = toIrt(config.rechargeAmount);
    if (monthlyCapExceeded(monthTotal, recharge, toIrt(config.monthlyLimit))) {
      await this.prisma.autoRechargeConfig.update({
        where: { id: config.id },
        data: { pausedReason: 'monthly_limit', enabled: false },
      });
      await this.alerts.autoRechargePaused(
        tenantId,
        'سقف شارژ خودکار ماهانه پر شد',
      );
      return { triggered: false, reason: 'monthly_limit' };
    }

    const spending = await this.prisma.spendingLimit.findUnique({
      where: { tenantId },
    });
    if (spending?.monthlyLimit != null) {
      const usedAgg = await this.prisma.usageRecord.aggregate({
        where: { tenantId, createdAt: { gte: tehranMonthStart() } },
        _sum: { customerCharge: true },
      });
      if (toIrt(usedAgg._sum.customerCharge) >= toIrt(spending.monthlyLimit)) {
        return { triggered: false, reason: 'spending_limit' };
      }
    }

    const pending = await this.prisma.billingPayment.findFirst({
      where: { tenantId, kind: 'AUTO_RECHARGE', status: 'pending' },
    });
    if (pending) {
      return { triggered: false, reason: 'pending_payment' };
    }

    const settings = await this.prisma.billingSettings.findUnique({
      where: { id: 'global' },
    });
    const cooldownSec = settings?.autoRechargeCooldownSec ?? 900;
    await this.prisma.autoRechargeConfig.update({
      where: { id: config.id },
      data: { cooldownUntil: new Date(Date.now() + cooldownSec * 1000) },
    });

    const bucket = Math.floor(
      wallet.available / Math.max(1, toIrt(config.thresholdAmount)),
    );
    const idempotencyKey = `auto-recharge:${tenantId}:${tehranMonthKey()}:${toIrt(config.thresholdAmount)}:${bucket}`;

    const existingPaid = await this.prisma.walletTransaction.findUnique({
      where: { idempotencyKey: `ledger:${idempotencyKey}` },
    });
    if (existingPaid) {
      return { triggered: false, reason: 'already_recharged' };
    }

    const created = await this.payments.createPayment({
      tenantId,
      amount: recharge,
      kind: 'AUTO_RECHARGE',
      idempotencyKey,
      description: `شارژ خودکار اعتبار سلومـا — ${recharge.toLocaleString('fa-IR')} تومان`,
    });

    if (created.alreadyPaid) {
      return { triggered: true, status: 'paid', payUrl: null };
    }

    if (created.payment.provider === 'mock') {
      await this.payments.verifyAndCredit(
        created.payment.id,
        true,
        created.payment.authority ?? created.payment.id,
      );
      return { triggered: true, status: 'paid', payUrl: null };
    }

    await this.prisma.notificationOutbox.create({
      data: {
        tenantId,
        channel: 'workspace',
        kind: 'billing.auto_recharge_pay',
        body: `موجودی کم است. برای شارژ خودکار ${recharge.toLocaleString('fa-IR')} تومان پرداخت را تکمیل کنید.`,
        status: 'pending',
      },
    });

    return {
      triggered: true,
      status: 'pending',
      payUrl: created.payUrl,
    };
  }
}
