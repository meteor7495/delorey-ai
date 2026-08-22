import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../platform/prisma.service';
import { BILLING_CURRENCY } from './domain/billing.types';
import { tehranMonthStart, toIrt } from './domain/money';

const ALERT_KINDS = {
  low: 'low_balance',
  critical: 'critical_balance',
  paused: 'auto_recharge_paused',
  failed: 'auto_recharge_failed',
  spending: 'spending_limit',
} as const;

@Injectable()
export class BillingAlertService {
  private readonly log = new Logger(BillingAlertService.name);

  constructor(private readonly prisma: PrismaService) {}

  async afterBalanceChange(tenantId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { tenantId },
    });
    if (!wallet) return;
    const available = toIrt(wallet.balance) - toIrt(wallet.reserved);
    const critical = toIrt(wallet.criticalBalanceThreshold);
    const low = toIrt(wallet.lowBalanceThreshold);
    if (available <= critical) {
      await this.emit(
        tenantId,
        wallet.id,
        ALERT_KINDS.critical,
        'اعتبار سلومـا شما تقریباً تمام شده است. لطفاً کیف پول را شارژ کنید.',
      );
    } else if (available <= low) {
      await this.emit(
        tenantId,
        wallet.id,
        ALERT_KINDS.low,
        'اعتبار سلومـا شما رو به اتمام است.',
      );
    }
  }

  async autoRechargePaused(tenantId: string, reason: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { tenantId } });
    if (!wallet) return;
    await this.emit(
      tenantId,
      wallet.id,
      ALERT_KINDS.paused,
      `شارژ خودکار متوقف شد: ${reason}`,
    );
  }

  async autoRechargeFailed(tenantId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { tenantId } });
    if (!wallet) return;
    await this.emit(
      tenantId,
      wallet.id,
      ALERT_KINDS.failed,
      'شارژ خودکار ناموفق بود. لطفاً کیف پول را دستی شارژ کنید.',
    );
  }

  async spendingLimitReached(tenantId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { tenantId } });
    if (!wallet) return;
    await this.emit(
      tenantId,
      wallet.id,
      ALERT_KINDS.spending,
      'سقف هزینه ماهانه شما پر شده است. مصرف محدود شد.',
    );
  }

  private async emit(
    tenantId: string,
    walletId: string,
    kind: string,
    body: string,
  ) {
    const settings = await this.prisma.billingSettings.findUnique({
      where: { id: 'global' },
    });
    const cooldownSec = settings?.alertCooldownSec ?? 86_400;
    const existing = await this.prisma.billingAlert.findUnique({
      where: { walletId_kind: { walletId, kind } },
    });
    if (
      existing &&
      Date.now() - existing.lastSentAt.getTime() < cooldownSec * 1000
    ) {
      return;
    }

    await this.prisma.billingAlert.upsert({
      where: { walletId_kind: { walletId, kind } },
      create: { tenantId, walletId, kind, lastSentAt: new Date() },
      update: { lastSentAt: new Date() },
    });

    await this.prisma.notificationOutbox.create({
      data: {
        tenantId,
        channel: 'workspace',
        kind: `billing.${kind}`,
        body,
        status: 'pending',
      },
    });

    await this.prisma.adminAuditEvent.create({
      data: {
        tenantId,
        actorUserId: 'system',
        action: `billing.${kind}`,
        summary: body,
        payload: { walletId, kind, currency: BILLING_CURRENCY },
      },
    });

    this.log.log(`billing alert ${kind} tenant=${tenantId}`);
  }

  async monthAutoRechargeTotal(tenantId: string): Promise<number> {
    const from = tehranMonthStart();
    const agg = await this.prisma.walletTransaction.aggregate({
      where: {
        tenantId,
        type: 'AUTO_RECHARGE',
        createdAt: { gte: from },
      },
      _sum: { amount: true },
    });
    return Math.max(0, toIrt(agg._sum.amount));
  }
}
