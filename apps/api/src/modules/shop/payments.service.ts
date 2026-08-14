import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../platform/prisma.service';
import { InventoryService } from './inventory.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly inventory: InventoryService,
  ) {}

  private publicBase() {
    return (
      this.config.get<string>('PUBLIC_API_BASE_URL') ??
      `http://localhost:${this.config.get('API_PORT') ?? 3001}`
    );
  }

  private merchantId(storeMerchant?: string | null) {
    return (
      storeMerchant?.trim() ||
      this.config.get<string>('ZARINPAL_MERCHANT_ID')?.trim() ||
      ''
    );
  }

  async startPayment(input: {
    tenantId: string;
    orderId: string;
    amount: number;
    description: string;
    storeMerchantId?: string | null;
  }) {
    const merchant = this.merchantId(input.storeMerchantId);
    const callback = `${this.publicBase()}/v1/payments/zarinpal/callback`;

    if (!merchant) {
      const authority = `MOCK-${input.orderId}`;
      await this.prisma.storefrontOrder.update({
        where: { id: input.orderId },
        data: { paymentAuthority: authority },
      });
      return {
        authority,
        payUrl: `${this.publicBase()}/v1/payments/mock/${input.orderId}`,
        mocked: true,
      };
    }

    const res = await fetch('https://api.zarinpal.com/pg/v4/payment/request.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: Math.round(input.amount),
        callback_url: callback,
        description: input.description.slice(0, 250),
        metadata: { order_id: input.orderId },
      }),
    });
    const json = (await res.json()) as {
      data?: { code?: number; authority?: string };
      errors?: unknown;
    };
    const authority = json.data?.authority;
    if (!authority || json.data?.code !== 100) {
      throw new BadRequestException('درگاه پرداخت در دسترس نیست؛ بعداً تلاش کنید');
    }
    await this.prisma.storefrontOrder.update({
      where: { id: input.orderId },
      data: { paymentAuthority: authority },
    });
    return {
      authority,
      payUrl: `https://www.zarinpal.com/pg/StartPay/${authority}`,
      mocked: false,
    };
  }

  async confirmMock(orderId: string) {
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد');
    if (order.status !== 'pending_payment') {
      return { ok: true, already: true, orderId: order.id, status: order.status };
    }
    await this.prisma.storefrontOrder.update({
      where: { id: order.id },
      data: { status: 'confirmed', paymentRef: 'mock' },
    });
    return { ok: true, orderId: order.id, status: 'confirmed' };
  }

  async confirmZarinpal(authority: string, status: string) {
    const order = await this.prisma.storefrontOrder.findFirst({
      where: { paymentAuthority: authority },
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد');
    if (status !== 'OK') {
      if (order.status === 'confirmed') {
        return { ok: true, already: true, orderId: order.id, status: order.status };
      }
      if (order.status !== 'cancelled') {
        await this.prisma.storefrontOrder.update({
          where: { id: order.id },
          data: { status: 'cancelled' },
        });
        await this.inventory.restockOrder(
          order.tenantId,
          order.id,
          order.orderNumber,
        );
      }
      return { ok: false, orderId: order.id, status: 'cancelled' };
    }
    if (order.status === 'confirmed') {
      return { ok: true, already: true, orderId: order.id, status: 'confirmed' };
    }
    const settings = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId: order.tenantId },
    });
    const merchant = this.merchantId(settings?.zarinpalMerchantId);
    const res = await fetch('https://api.zarinpal.com/pg/v4/payment/verify.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        merchant_id: merchant,
        amount: Math.round(Number(order.totalAmount)),
        authority,
      }),
    });
    const json = (await res.json()) as {
      data?: { code?: number; ref_id?: number };
    };
    if (json.data?.code !== 100 && json.data?.code !== 101) {
      throw new BadRequestException('تأیید پرداخت ناموفق بود');
    }
    await this.prisma.storefrontOrder.update({
      where: { id: order.id },
      data: {
        status: 'confirmed',
        paymentRef: String(json.data.ref_id ?? authority),
      },
    });
    return { ok: true, orderId: order.id, status: 'confirmed' };
  }
}
