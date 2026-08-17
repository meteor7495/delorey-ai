import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import {
  canonicalizeOrderStatus,
  isPaidFulfillmentStatus,
  mockPayUrl,
  resolvePaymentProviderId,
  zarinpalEndpoints,
  zarinpalPayUrl,
} from './domain';
import { OrderWorkflowService } from './order-workflow.service';
import { MockPaymentProvider } from './payments/mock.payment-provider';
import { PaymentLockService } from './payments/payment-lock.service';
import type { IPaymentProvider } from './payments/payment-provider';
import { ZarinpalPaymentProvider } from './payments/zarinpal.payment-provider';
import { CommerceEventsService } from './commerce-events.service';
import { NotificationService } from './notification.service';
import { orderStatusNotifyBody } from './domain';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly workflow: OrderWorkflowService,
    private readonly lock: PaymentLockService,
    private readonly mock: MockPaymentProvider,
    private readonly zarinpal: ZarinpalPaymentProvider,
    private readonly events: CommerceEventsService,
    private readonly notifications: NotificationService,
  ) {}

  private publicBase() {
    return (
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`
    );
  }

  private storefrontBase() {
    return this.config.get<string>('STOREFRONT_BASE_URL') ?? 'http://localhost:3020';
  }

  private merchantId(storeMerchant?: string | null) {
    return (
      storeMerchant?.trim() ||
      this.config.get<string>('ZARINPAL_MERCHANT_ID')?.trim() ||
      ''
    );
  }

  private providerFor(merchant: string): IPaymentProvider {
    return resolvePaymentProviderId(merchant) === 'zarinpal'
      ? this.zarinpal
      : this.mock;
  }

  async trackUrl(
    order: {
      tenantId: string;
      orderNumber: string;
      customerPhone: string;
    },
    pay: 'ok' | 'fail',
  ) {
    const settings = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId: order.tenantId },
    });
    const q = new URLSearchParams({
      orderNumber: order.orderNumber,
      phone: order.customerPhone,
      pay,
    });
    return `${this.storefrontBase()}/s/${settings?.storeSlug ?? 'shop'}/track?${q.toString()}`;
  }

  async startPayment(input: {
    tenantId: string;
    orderId: string;
    amount: number;
    description: string;
    storeMerchantId?: string | null;
  }) {
    return this.lock.withOrderLock(input.tenantId, input.orderId, async () => {
      const order = await this.prisma.storefrontOrder.findFirst({
        where: { id: input.orderId, tenantId: input.tenantId },
      });
      if (!order) throw new NotFoundException('سفارش پیدا نشد');

      const existing = await this.prisma.payment.findFirst({
        where: {
          tenantId: input.tenantId,
          orderId: input.orderId,
          status: { in: ['pending', 'paid'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing?.status === 'paid' && existing.authority) {
        return {
          authority: existing.authority,
          payUrl: this.payUrlFor(existing.provider, existing.authority, order.id),
          mocked: existing.provider === 'mock',
        };
      }
      if (existing?.status === 'pending' && existing.authority) {
        return {
          authority: existing.authority,
          payUrl: this.payUrlFor(existing.provider, existing.authority, order.id),
          mocked: existing.provider === 'mock',
        };
      }

      const merchant = this.merchantId(input.storeMerchantId);
      const provider = this.providerFor(merchant);
      const requested = await provider.request({
        orderId: input.orderId,
        amount: input.amount,
        description: input.description,
        merchantId: merchant,
        callbackUrl: `${this.publicBase()}/v1/payments/zarinpal/callback`,
      });

      try {
        const payment = await this.prisma.payment.create({
          data: {
            tenantId: input.tenantId,
            orderId: input.orderId,
            provider: provider.id,
            status: 'pending',
            amount: input.amount,
            currency: order.currency,
            authority: requested.authority,
          },
        });
        await this.recordTx({
          tenantId: input.tenantId,
          paymentId: payment.id,
          kind: 'request',
          status: 'success',
          provider: provider.id,
          paymentReference: requested.authority,
          payload: requested.raw,
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          const dup = await this.prisma.payment.findFirst({
            where: { provider: provider.id, authority: requested.authority },
          });
          if (dup) {
            return {
              authority: requested.authority,
              payUrl: requested.payUrl,
              mocked: provider.id === 'mock',
            };
          }
        }
        throw err;
      }

      await this.prisma.storefrontOrder.update({
        where: { id: input.orderId },
        data: { paymentAuthority: requested.authority },
      });
      await this.events.track({
        tenantId: input.tenantId,
        name: 'payment_started',
        channel: order.channel,
        customerId: order.customerId,
        orderId: order.id,
      });
      return {
        authority: requested.authority,
        payUrl: requested.payUrl,
        mocked: provider.id === 'mock',
      };
    });
  }

  async confirmMock(orderId: string, result: 'ok' | 'fail' = 'ok') {
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد');

    return this.lock.withOrderLock(order.tenantId, order.id, async () => {
      const fresh = await this.prisma.storefrontOrder.findUnique({
        where: { id: orderId },
      });
      if (!fresh) throw new NotFoundException('سفارش پیدا نشد');
      const payment = await this.ensurePaymentRow(fresh, 'mock');

      if (result === 'fail') {
        await this.failPayment(payment, 'callback', fresh.paymentAuthority);
        const updated = await this.workflow.markPaymentFailed(
          fresh.tenantId,
          fresh.id,
        );
        return {
          ok: false,
          already: canonicalizeOrderStatus(updated.status) !== 'payment_failed',
          orderId: updated.id,
          status: updated.status,
        };
      }

      if (fresh.paymentStatus === 'paid' && isPaidFulfillmentStatus(fresh.status)) {
        return {
          ok: true,
          already: true,
          orderId: fresh.id,
          status: fresh.status,
        };
      }

      const verified = await this.mock.verify({
        authority: fresh.paymentAuthority ?? payment.authority ?? `MOCK-${fresh.id}`,
        amount: Number(fresh.totalAmount),
        merchantId: '',
      });
      await this.completePayment(
        payment,
        verified.reference ?? payment.authority ?? 'mock',
        verified.raw,
      );
      const updated = await this.workflow.markPaid(
        fresh.tenantId,
        fresh.id,
        verified.reference ?? 'mock',
      );
      await this.recordPaymentCompleted(updated);
      return {
        ok: true,
        already: false,
        orderId: updated.id,
        status: updated.status,
      };
    });
  }

  async confirmZarinpal(authority: string, status: string) {
    const found = await this.findByAuthority(authority);
    if (!found) throw new NotFoundException('سفارش پیدا نشد');

    return this.lock.withOrderLock(found.order.tenantId, found.order.id, async () => {
      const order = await this.prisma.storefrontOrder.findUnique({
        where: { id: found.order.id },
      });
      if (!order) throw new NotFoundException('سفارش پیدا نشد');
      const payment = await this.ensurePaymentRow(order, 'zarinpal', authority);

      await this.recordTx({
        tenantId: order.tenantId,
        paymentId: payment.id,
        kind: 'callback',
        status: status === 'OK' ? 'success' : 'failed',
        provider: 'zarinpal',
        paymentReference: authority,
        payload: { status },
      });

      if (status !== 'OK') {
        await this.failPayment(payment, null, authority);
        const updated = await this.workflow.markPaymentFailed(
          order.tenantId,
          order.id,
        );
        return { ok: false, orderId: updated.id, status: updated.status };
      }

      if (order.paymentStatus === 'paid' && isPaidFulfillmentStatus(order.status)) {
        return { ok: true, already: true, orderId: order.id, status: order.status };
      }

      const settings = await this.prisma.storefrontSettings.findUnique({
        where: { tenantId: order.tenantId },
      });
      const merchant = this.merchantId(settings?.zarinpalMerchantId);
      const verified = await this.zarinpal.verify({
        authority,
        amount: Number(order.totalAmount),
        merchantId: merchant,
      });
      if (!verified.ok) {
        await this.failPayment(payment, 'verify', authority, verified.raw);
        const updated = await this.workflow.markPaymentFailed(
          order.tenantId,
          order.id,
        );
        return { ok: false, orderId: updated.id, status: updated.status };
      }

      await this.completePayment(
        payment,
        verified.reference || authority,
        verified.raw,
      );
      const updated = await this.workflow.markPaid(
        order.tenantId,
        order.id,
        String(verified.reference || authority),
      );
      await this.recordPaymentCompleted(updated);
      return { ok: true, orderId: updated.id, status: updated.status };
    });
  }

  private async recordPaymentCompleted(order: {
    id: string;
    tenantId: string;
    orderNumber: string;
    channel: string;
    customerId: string | null;
  }) {
    await this.events.track({
      tenantId: order.tenantId,
      name: 'payment_completed',
      channel: order.channel,
      customerId: order.customerId,
      orderId: order.id,
    });
    const body = orderStatusNotifyBody(order.orderNumber, 'payment_completed');
    if (body) {
      await this.notifications.notify({
        tenantId: order.tenantId,
        channel: order.channel,
        customerId: order.customerId,
        orderId: order.id,
        kind: 'payment_completed',
        body,
      });
    }
  }

  private payUrlFor(provider: string, authority: string, orderId: string) {
    if (provider === 'mock') {
      return mockPayUrl(this.publicBase(), orderId);
    }
    const flag = this.config.get<string>('ZARINPAL_SANDBOX')?.trim();
    const sandbox = flag === '1' || flag === 'true';
    return zarinpalPayUrl(zarinpalEndpoints(sandbox).start, authority);
  }

  private async findByAuthority(authority: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { authority },
    });
    if (payment) {
      const order = await this.prisma.storefrontOrder.findUnique({
        where: { id: payment.orderId },
      });
      if (!order) return null;
      return { payment, order };
    }
    const order = await this.prisma.storefrontOrder.findFirst({
      where: { paymentAuthority: authority },
    });
    if (!order) return null;
    return { payment: null, order };
  }

  private async ensurePaymentRow(
    order: {
      id: string;
      tenantId: string;
      currency: string;
      totalAmount: Prisma.Decimal;
      paymentAuthority: string | null;
    },
    provider: string,
    authority?: string,
  ) {
    const existing = await this.prisma.payment.findFirst({
      where: {
        tenantId: order.tenantId,
        orderId: order.id,
        status: { in: ['pending', 'paid'] },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing) return existing;
    return this.prisma.payment.create({
      data: {
        tenantId: order.tenantId,
        orderId: order.id,
        provider,
        status: 'pending',
        amount: order.totalAmount,
        currency: order.currency,
        authority: authority ?? order.paymentAuthority,
      },
    });
  }

  private async completePayment(
    payment: { id: string; tenantId: string; provider: string; status: string },
    reference: string,
    raw?: unknown,
  ) {
    if (payment.status !== 'paid') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'paid', reference },
      });
    }
    await this.recordTx({
      tenantId: payment.tenantId,
      paymentId: payment.id,
      kind: 'verify',
      status: 'success',
      provider: payment.provider,
      paymentReference: reference,
      payload: raw,
    });
  }

  private async failPayment(
    payment: { id: string; tenantId: string; provider: string; status: string },
    kind: 'verify' | 'callback' | null,
    reference: string | null,
    raw?: unknown,
  ) {
    if (payment.status !== 'paid') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'failed' },
      });
    }
    if (!kind) return;
    await this.recordTx({
      tenantId: payment.tenantId,
      paymentId: payment.id,
      kind,
      status: 'failed',
      provider: payment.provider,
      paymentReference: reference,
      payload: raw,
    });
  }

  private async recordTx(input: {
    tenantId: string;
    paymentId: string;
    kind: string;
    status: string;
    provider: string;
    paymentReference?: string | null;
    payload?: unknown;
  }) {
    await this.prisma.paymentTransaction.create({
      data: {
        tenantId: input.tenantId,
        paymentId: input.paymentId,
        kind: input.kind,
        status: input.status,
        provider: input.provider,
        paymentReference: input.paymentReference ?? null,
        payload:
          input.payload === undefined
            ? undefined
            : (input.payload as Prisma.InputJsonValue),
      },
    });
  }
}
