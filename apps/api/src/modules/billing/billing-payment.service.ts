import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { RedisLockService } from '../platform/redis-lock.service';
import { MockPaymentProvider } from '../shop/payments/mock.payment-provider';
import { ZarinpalPaymentProvider } from '../shop/payments/zarinpal.payment-provider';
import { resolvePaymentProviderId } from '../shop/domain/payment';
import { WalletService } from './wallet.service';
import { BILLING_CURRENCY } from './domain/billing.types';
import { toIrt } from './domain/money';

@Injectable()
export class BillingPaymentService {
  private readonly log = new Logger(BillingPaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly wallets: WalletService,
    private readonly locks: RedisLockService,
    private readonly mockPay: MockPaymentProvider,
    private readonly zarinpal: ZarinpalPaymentProvider,
    private readonly config: ConfigService,
  ) {}

  listPacks() {
    return this.prisma.creditPack.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async startPurchase(tenantId: string, packIdOrSlug: string, idempotencyKey?: string) {
    const pack =
      (await this.prisma.creditPack.findFirst({
        where: {
          status: 'active',
          OR: [{ id: packIdOrSlug }, { slug: packIdOrSlug }],
        },
      })) ?? null;
    if (!pack) throw new NotFoundException('بسته اعتبار پیدا نشد');

    const key = idempotencyKey?.trim() || `credit-purchase:${tenantId}:${pack.id}:${Date.now()}`;
    const lockKey = `t:${tenantId}:lock:billing-pay:${key}`;
    return this.locks.withLock(lockKey, () =>
      this.createPayment({
        tenantId,
        amount: toIrt(pack.amount),
        kind: 'CREDIT_PURCHASE',
        creditPackId: pack.id,
        idempotencyKey: key,
        description: `خرید اعتبار سلومـا — ${pack.label}`,
      }),
    );
  }

  async createPayment(args: {
    tenantId: string;
    amount: number;
    kind: 'CREDIT_PURCHASE' | 'AUTO_RECHARGE';
    creditPackId?: string | null;
    idempotencyKey: string;
    description: string;
  }) {
    const existing = await this.prisma.billingPayment.findUnique({
      where: { idempotencyKey: args.idempotencyKey },
    });
    if (existing) {
      if (existing.tenantId !== args.tenantId) {
        throw new NotFoundException();
      }
      if (existing.status === 'paid') {
        return { payment: existing, payUrl: null as string | null, alreadyPaid: true };
      }
      return {
        payment: existing,
        payUrl: this.payUrlFor(existing.provider, existing.id),
        alreadyPaid: false,
      };
    }

    const wallet = await this.wallets.getOrCreate(args.tenantId);
    const providerId = resolvePaymentProviderId(this.merchantId());
    const payment = await this.prisma.billingPayment.create({
      data: {
        tenantId: args.tenantId,
        walletId: wallet.id,
        kind: args.kind,
        status: 'pending',
        amount: args.amount,
        currency: BILLING_CURRENCY,
        provider: providerId,
        creditPackId: args.creditPackId ?? null,
        idempotencyKey: args.idempotencyKey,
      },
    });

    const provider = providerId === 'zarinpal' ? this.zarinpal : this.mockPay;
    const requested = await provider.request({
      orderId: payment.id,
      amount: args.amount,
      description: args.description.slice(0, 250),
      merchantId: this.merchantId() ?? '',
      callbackUrl: this.callbackUrl(providerId, payment.id),
    });

    const updated = await this.prisma.billingPayment.update({
      where: { id: payment.id },
      data: { authority: requested.authority, provider: providerId },
    });

    return {
      payment: updated,
      payUrl: this.payUrlFor(providerId, payment.id, requested.payUrl),
      alreadyPaid: false,
    };
  }

  async confirmMock(paymentId: string, result: 'ok' | 'fail') {
    return this.verifyAndCredit(paymentId, result === 'ok');
  }

  async confirmZarinpal(authority: string, status: string) {
    const payment = await this.prisma.billingPayment.findFirst({
      where: { authority, provider: 'zarinpal' },
    });
    if (!payment) {
      return { ok: false, paymentId: null as string | null };
    }
    if (String(status).toUpperCase() !== 'OK') {
      await this.verifyAndCredit(payment.id, false);
      return { ok: false, paymentId: payment.id };
    }
    const verified = await this.zarinpal.verify({
      authority,
      amount: toIrt(payment.amount),
      merchantId: this.merchantId() ?? '',
    });
    const ok = await this.verifyAndCredit(
      payment.id,
      verified.ok,
      verified.reference ?? authority,
    );
    return { ok, paymentId: payment.id };
  }

  /**
   * Idempotent verify → credit. Duplicate callbacks return success without
   * double-crediting (unique provider_transaction_id + ledger idempotency_key).
   */
  async verifyAndCredit(
    paymentId: string,
    ok: boolean,
    providerRef?: string,
  ): Promise<boolean> {
    const lockKey = `t:billing:lock:payment:${paymentId}`;
    return this.locks.withLock(lockKey, async () => {
      const payment = await this.prisma.billingPayment.findUnique({
        where: { id: paymentId },
      });
      if (!payment) return false;
      if (payment.status === 'paid') return true;
      if (!ok) {
        if (payment.status !== 'failed') {
          await this.prisma.billingPayment.update({
            where: { id: paymentId },
            data: { status: 'failed' },
          });
        }
        return false;
      }

      const ref = providerRef || payment.authority || payment.id;

      if (payment.providerTransactionId && payment.providerTransactionId !== ref) {
        const other = await this.prisma.billingPayment.findUnique({
          where: { providerTransactionId: ref },
        });
        if (other && other.id !== payment.id) {
          this.log.warn(`duplicate provider tx ${ref} on ${paymentId}`);
          return payment.status === 'paid';
        }
      }

      await this.wallets.credit(payment.tenantId, {
        type:
          payment.kind === 'AUTO_RECHARGE' ? 'AUTO_RECHARGE' : 'CREDIT_PURCHASE',
        amount: toIrt(payment.amount),
        description:
          payment.kind === 'AUTO_RECHARGE'
            ? 'شارژ خودکار کیف پول'
            : 'خرید اعتبار',
        referenceType: 'billing_payment',
        referenceId: payment.id,
        idempotencyKey: `ledger:${payment.idempotencyKey}`,
      });

      try {
        await this.prisma.billingPayment.update({
          where: { id: payment.id },
          data: { status: 'paid', providerTransactionId: ref },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          this.log.warn(`provider_transaction_id replay ${ref}`);
          return true;
        }
        throw err;
      }

      await this.prisma.adminAuditEvent.create({
        data: {
          tenantId: payment.tenantId,
          actorUserId: 'system',
          action: 'billing.payment_paid',
          summary: `شارژ کیف پول ${toIrt(payment.amount).toLocaleString('fa-IR')} تومان`,
          payload: { paymentId: payment.id, kind: payment.kind },
        },
      });
      return true;
    });
  }

  async getForTenant(tenantId: string, paymentId: string) {
    const payment = await this.prisma.billingPayment.findFirst({
      where: { id: paymentId, tenantId },
    });
    if (!payment) throw new NotFoundException();
    return payment;
  }

  workspaceReturnUrl(paid: boolean) {
    const base = (
      this.config.get<string>('WORKSPACE_BASE_URL') ?? 'http://localhost:3010'
    ).replace(/\/$/, '');
    return `${base}/billing?paid=${paid ? '1' : '0'}`;
  }

  merchantId() {
    return (
      this.config.get<string>('SELOMA_ZARINPAL_MERCHANT_ID')?.trim() ||
      this.config.get<string>('ZARINPAL_MERCHANT_ID')?.trim() ||
      ''
    );
  }

  private publicBase() {
    return (
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`
    ).replace(/\/$/, '');
  }

  private callbackUrl(provider: string, paymentId: string) {
    if (provider === 'zarinpal') {
      return `${this.publicBase()}/v1/billing/payments/zarinpal/callback`;
    }
    return `${this.publicBase()}/v1/billing/payments/mock/${paymentId}/complete`;
  }

  private payUrlFor(provider: string, paymentId: string, gatewayUrl?: string) {
    if (provider === 'mock') {
      return `${this.publicBase()}/v1/billing/payments/mock/${paymentId}`;
    }
    return gatewayUrl ?? `${this.publicBase()}/v1/billing/payments/zarinpal/callback`;
  }
}
