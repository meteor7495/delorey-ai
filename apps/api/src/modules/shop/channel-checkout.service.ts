import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import { CommerceRetrievalService } from './commerce-retrieval.service';
import { CustomersService, type SalesChannel } from './customers.service';
import { isValidMobile, normalizePhone } from './phone';
import { ShopService } from './shop.service';

const BUY_RE =
  /(سفارش\s*بده|ثبت\s*سفارش|میخوام بخرم|می‌خوام بخرم|بخرمش|بخرم|سبد|checkout)/i;
const YES_RE = /^(بله|آره|آری|همین|ثبت[\s‌]?شده|ok|yes)$/i;
const NEW_ADDR_RE = /(جدید|دیگر|دیگه|عوض)/i;
const SKU_RE = /\b([A-Z]{2,10}-\d{2,6})\b/i;

type Step =
  | 'idle'
  | 'awaiting_product'
  | 'awaiting_address_confirm'
  | 'awaiting_new_address'
  | 'awaiting_name'
  | 'awaiting_phone'
  | 'awaiting_address'
  | 'awaiting_payment';

type Payload = {
  name?: string;
  phone?: string;
  address?: string;
  paymentMethod?: 'cod' | 'online';
};

@Injectable()
export class ChannelCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly shop: ShopService,
    private readonly customers: CustomersService,
    private readonly retrieval: CommerceRetrievalService,
  ) {}

  cartSession(channel: SalesChannel, conversationId: string) {
    return `${channel}:${conversationId}`;
  }

  async handleTurn(input: {
    tenantId: string;
    conversationId: string;
    channel: SalesChannel;
    userText: string;
    externalThreadId: string | null;
  }): Promise<{ reply: string; decision: string } | null> {
    const session = await this.getSession(input.tenantId, input.conversationId);
    const active = session.step !== 'idle';
    if (!active && !BUY_RE.test(input.userText)) {
      return null;
    }

    const options = await this.shop.paymentOptions(input.tenantId);
    const sessionId = this.cartSession(input.channel, input.conversationId);
    const payload = (session.payload ?? {}) as Payload;

    if (session.step === 'idle') {
      const added = await this.tryAddProduct(
        input.tenantId,
        sessionId,
        input.userText,
      );
      const cart = await this.shop.getCart(options.storeSlug, sessionId);
      if (!cart.items.length) {
        await this.saveSession(input.tenantId, input.conversationId, 'awaiting_product', payload);
        return {
          decision: 'place_order',
          reply: added.note
            ?? 'کدام محصول را سفارش می‌دهید؟ نام یا کد کالا را بفرستید.',
        };
      }
      return this.advanceAfterCart(input, sessionId, payload, options);
    }

    if (session.step === 'awaiting_product') {
      const added = await this.tryAddProduct(
        input.tenantId,
        sessionId,
        input.userText,
      );
      const cart = await this.shop.getCart(options.storeSlug, sessionId);
      if (!cart.items.length) {
        return {
          decision: 'place_order',
          reply: added.note ?? 'این کالا را در کاتالوگ پیدا نکردم. نام دقیق‌تری بفرستید.',
        };
      }
      return this.advanceAfterCart(input, sessionId, payload, options);
    }

    if (session.step === 'awaiting_address_confirm') {
      if (YES_RE.test(input.userText.trim())) {
        return this.askPaymentOrPlace(input, sessionId, payload, options);
      }
      if (NEW_ADDR_RE.test(input.userText)) {
        await this.saveSession(
          input.tenantId,
          input.conversationId,
          'awaiting_new_address',
          payload,
        );
        return { decision: 'place_order', reply: 'آدرس جدید را بفرستید.' };
      }
      return {
        decision: 'place_order',
        reply: 'به آدرس ثبت‌شده بفرستم یا آدرس دیگری مدنظر است؟',
      };
    }

    if (session.step === 'awaiting_new_address') {
      if (input.userText.trim().length < 5) {
        return { decision: 'place_order', reply: 'آدرس را کامل‌تر بنویسید.' };
      }
      payload.address = input.userText.trim();
      return this.askPaymentOrPlace(input, sessionId, payload, options);
    }

    if (session.step === 'awaiting_name') {
      if (input.userText.trim().length < 2) {
        return { decision: 'place_order', reply: 'نام گیرنده را بفرستید.' };
      }
      payload.name = input.userText.trim();
      await this.saveSession(
        input.tenantId,
        input.conversationId,
        'awaiting_phone',
        payload,
      );
      return { decision: 'place_order', reply: 'شماره موبایل را بفرستید.' };
    }

    if (session.step === 'awaiting_phone') {
      const phone = normalizePhone(input.userText);
      if (!isValidMobile(phone) && phone.length < 8) {
        return { decision: 'place_order', reply: 'شماره موبایل معتبر بفرستید (مثلاً 0912…).' };
      }
      payload.phone = phone;
      const known = await this.customers.lookupByPhone(input.tenantId, phone);
      if (known?.defaultAddress) {
        payload.name = payload.name || known.name;
        payload.address = known.defaultAddress;
        await this.saveSession(
          input.tenantId,
          input.conversationId,
          'awaiting_address_confirm',
          payload,
        );
        return {
          decision: 'place_order',
          reply: `آدرس ثبت‌شده:\n${known.defaultAddress}\nبه همین آدرس بفرستم یا آدرس دیگری مدنظر است؟`,
        };
      }
      await this.saveSession(
        input.tenantId,
        input.conversationId,
        'awaiting_address',
        payload,
      );
      return { decision: 'place_order', reply: 'آدرس تحویل را بفرستید.' };
    }

    if (session.step === 'awaiting_address') {
      if (input.userText.trim().length < 5) {
        return { decision: 'place_order', reply: 'آدرس را کامل‌تر بنویسید.' };
      }
      payload.address = input.userText.trim();
      return this.askPaymentOrPlace(input, sessionId, payload, options);
    }

    if (session.step === 'awaiting_payment') {
      const text = input.userText.trim();
      if (/(آنلاین|درگاه|کارت|online)/i.test(text) && options.onlinePaymentEnabled) {
        payload.paymentMethod = 'online';
      } else if (/(محل|پیک|cod)/i.test(text) && options.codEnabled) {
        payload.paymentMethod = 'cod';
      } else if (options.codEnabled && !options.onlinePaymentEnabled) {
        payload.paymentMethod = 'cod';
      } else if (options.onlinePaymentEnabled && !options.codEnabled) {
        payload.paymentMethod = 'online';
      } else {
        return {
          decision: 'place_order',
          reply: this.paymentPrompt(options),
        };
      }
      return this.finishOrder(input, sessionId, payload, options);
    }

    return null;
  }

  private async advanceAfterCart(
    input: {
      tenantId: string;
      conversationId: string;
      channel: SalesChannel;
      externalThreadId: string | null;
    },
    sessionId: string,
    payload: Payload,
    options: Awaited<ReturnType<ShopService['paymentOptions']>>,
  ) {
    const known =
      (input.externalThreadId
        ? await this.customers.lookupByIdentity(
            input.tenantId,
            input.channel,
            input.externalThreadId,
          )
        : null) ?? null;
    if (known?.defaultAddress) {
      payload.name = known.name;
      payload.phone = known.phone;
      payload.address = known.defaultAddress;
      await this.saveSession(
        input.tenantId,
        input.conversationId,
        'awaiting_address_confirm',
        payload,
      );
      const cart = await this.shop.getCart(options.storeSlug, sessionId);
      return {
        decision: 'place_order',
        reply: `سبد: ${cart.items.map((i: { product: { title: string }; quantity: number }) => `${i.product.title} × ${i.quantity}`).join('، ')}\nآدرس ثبت‌شده:\n${known.defaultAddress}\nبه همین آدرس بفرستم یا آدرس دیگری مدنظر است؟`,
      };
    }
    await this.saveSession(
      input.tenantId,
      input.conversationId,
      'awaiting_name',
      payload,
    );
    return { decision: 'place_order', reply: 'نام گیرنده را بفرستید.' };
  }

  private async askPaymentOrPlace(
    input: {
      tenantId: string;
      conversationId: string;
      channel: SalesChannel;
      externalThreadId: string | null;
    },
    sessionId: string,
    payload: Payload,
    options: Awaited<ReturnType<ShopService['paymentOptions']>>,
  ) {
    if (options.codEnabled && options.onlinePaymentEnabled) {
      await this.saveSession(
        input.tenantId,
        input.conversationId,
        'awaiting_payment',
        payload,
      );
      return { decision: 'place_order', reply: this.paymentPrompt(options) };
    }
    payload.paymentMethod = options.codEnabled ? 'cod' : 'online';
    return this.finishOrder(input, sessionId, payload, options);
  }

  private paymentPrompt(options: {
    codEnabled: boolean;
    onlinePaymentEnabled: boolean;
  }) {
    if (options.codEnabled && options.onlinePaymentEnabled) {
      return 'روش پرداخت: در محل یا آنلاین؟';
    }
    if (options.onlinePaymentEnabled) return 'پرداخت آنلاین انجام می‌شود. تأیید کنید.';
    return 'پرداخت در محل. تأیید کنید.';
  }

  private async finishOrder(
    input: {
      tenantId: string;
      conversationId: string;
      channel: SalesChannel;
      externalThreadId: string | null;
    },
    sessionId: string,
    payload: Payload,
    options: Awaited<ReturnType<ShopService['paymentOptions']>>,
  ) {
    if (!payload.name || !payload.phone || !payload.address) {
      await this.saveSession(
        input.tenantId,
        input.conversationId,
        'awaiting_name',
        payload,
      );
      return { decision: 'place_order', reply: 'نام گیرنده را بفرستید.' };
    }
    try {
      const order = await this.shop.placeOrder({
        tenantId: input.tenantId,
        sessionId,
        channel: input.channel,
        customerName: payload.name,
        customerPhone: payload.phone,
        customerAddress: payload.address,
        paymentMethod: payload.paymentMethod,
        identityExternalId: input.externalThreadId,
        storeMerchantId: options.zarinpalMerchantId,
        codEnabled: options.codEnabled,
        onlinePaymentEnabled: options.onlinePaymentEnabled,
      });
      await this.saveSession(input.tenantId, input.conversationId, 'idle', {});
      let reply = `سفارش ${order.orderNumber} ثبت شد (${order.totalAmount.toLocaleString('fa-IR')} ریال).`;
      if (order.payUrl) {
        reply += `\nپرداخت: ${order.payUrl}`;
      }
      return { decision: 'place_order', reply };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'ثبت سفارش نشد';
      return { decision: 'place_order_failed', reply: msg };
    }
  }

  private async tryAddProduct(
    tenantId: string,
    sessionId: string,
    userText: string,
  ) {
    const skuMatch = userText.match(SKU_RE);
    let product = skuMatch
      ? await this.prisma.product.findFirst({
          where: {
            tenantId,
            sku: { equals: skuMatch[1], mode: 'insensitive' },
            status: 'published',
            source: { in: ['native', 'mock'] },
          },
        })
      : null;
    if (!product) {
      const hits = await this.retrieval.searchProducts(tenantId, userText, {
        limit: 1,
      });
      if (hits[0]?.sku) {
        product = await this.prisma.product.findFirst({
          where: { tenantId, sku: hits[0].sku, status: 'published' },
        });
      }
    }
    if (!product) return { note: null as string | null };
    try {
      await this.shop.setCartItemForTenant(tenantId, {
        sessionId,
        productId: product.id,
        quantity: 1,
      });
      return { note: `«${product.title}» به سبد اضافه شد.` };
    } catch (e) {
      return {
        note: e instanceof Error ? e.message : 'افزودن به سبد ممکن نشد',
      };
    }
  }

  private async getSession(tenantId: string, conversationId: string) {
    const row = await this.prisma.channelCheckoutSession.findUnique({
      where: { conversationId },
    });
    if (row) return row;
    return this.prisma.channelCheckoutSession.create({
      data: { tenantId, conversationId, step: 'idle', payload: {} },
    });
  }

  private async saveSession(
    tenantId: string,
    conversationId: string,
    step: Step,
    payload: Payload,
  ) {
    await this.prisma.channelCheckoutSession.upsert({
      where: { conversationId },
      create: {
        tenantId,
        conversationId,
        step,
        payload: payload as Prisma.InputJsonValue,
      },
      update: { step, payload: payload as Prisma.InputJsonValue },
    });
  }
}
