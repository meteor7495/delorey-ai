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

  private sandbox() {
    const flag = this.config.get<string>('ZARINPAL_SANDBOX')?.trim();
    return flag === '1' || flag === 'true';
  }

  private zarinpalUrls() {
    if (this.sandbox()) {
      return {
        request: 'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
        verify: 'https://sandbox.zarinpal.com/pg/v4/payment/verify.json',
        start: 'https://sandbox.zarinpal.com/pg/StartPay',
      };
    }
    return {
      request: 'https://api.zarinpal.com/pg/v4/payment/request.json',
      verify: 'https://api.zarinpal.com/pg/v4/payment/verify.json',
      start: 'https://www.zarinpal.com/pg/StartPay',
    };
  }

  async trackUrl(order: {
    tenantId: string;
    orderNumber: string;
    customerPhone: string;
  }, pay: 'ok' | 'fail') {
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

    const urls = this.zarinpalUrls();
    const res = await fetch(urls.request, {
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
      payUrl: `${urls.start}/${authority}`,
      mocked: false,
    };
  }

  async confirmMock(orderId: string, result: 'ok' | 'fail' = 'ok') {
    const order = await this.prisma.storefrontOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد');
    if (result === 'fail') {
      if (
        order.status === 'confirmed' ||
        order.status === 'shipped' ||
        order.status === 'delivered'
      ) {
        return { ok: true, already: true, orderId: order.id, status: order.status };
      }
      await this.failOrder(order.id, order.status);
      return { ok: false, orderId: order.id, status: 'cancelled' as const };
    }
    if (order.status !== 'pending_payment') {
      return { ok: true, already: true, orderId: order.id, status: order.status };
    }
    await this.prisma.storefrontOrder.update({
      where: { id: order.id },
      data: { status: 'confirmed', paymentRef: 'mock' },
    });
    return { ok: true, orderId: order.id, status: 'confirmed' as const };
  }

  async confirmZarinpal(authority: string, status: string) {
    const order = await this.prisma.storefrontOrder.findFirst({
      where: { paymentAuthority: authority },
    });
    if (!order) throw new NotFoundException('سفارش پیدا نشد');
    if (status !== 'OK') {
      await this.failOrder(order.id, order.status);
      return { ok: false, orderId: order.id, status: 'cancelled' as const };
    }
    if (order.status === 'confirmed') {
      return { ok: true, already: true, orderId: order.id, status: 'confirmed' as const };
    }
    const settings = await this.prisma.storefrontSettings.findUnique({
      where: { tenantId: order.tenantId },
    });
    const merchant = this.merchantId(settings?.zarinpalMerchantId);
    const urls = this.zarinpalUrls();
    const res = await fetch(urls.verify, {
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
      await this.failOrder(order.id, order.status);
      return { ok: false, orderId: order.id, status: 'cancelled' as const };
    }
    await this.prisma.storefrontOrder.update({
      where: { id: order.id },
      data: {
        status: 'confirmed',
        paymentRef: String(json.data.ref_id ?? authority),
      },
    });
    return { ok: true, orderId: order.id, status: 'confirmed' as const };
  }

  private async failOrder(orderId: string, currentStatus: string) {
    if (currentStatus === 'confirmed' || currentStatus === 'shipped' || currentStatus === 'delivered') {
      return;
    }
    if (currentStatus !== 'cancelled') {
      const order = await this.prisma.storefrontOrder.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });
      await this.inventory.restockOrder(
        order.tenantId,
        order.id,
        order.orderNumber,
      );
    }
  }
}
