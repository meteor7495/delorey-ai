import { Injectable } from '@nestjs/common';
import { PrismaService } from '../platform/prisma.service';
import { CommerceRetrievalService } from './commerce-retrieval.service';
import {
  CHANNEL_CAPABILITIES,
  formatProduct,
  formatStartMenu,
  type SalesChannel,
} from '../adapters/channel-adapter';

@Injectable()
export class ChannelMenuService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retrieval: CommerceRetrievalService,
  ) {}

  startMenu(channel: SalesChannel) {
    return formatStartMenu(CHANNEL_CAPABILITIES[channel]);
  }

  async storePreview(tenantId: string, channel: SalesChannel): Promise<string> {
    const products = await this.retrieval.searchProducts(tenantId, '', {
      limit: 3,
    });
    if (!products.length) {
      return 'فعلاً کالای منتشرشده‌ای در فروشگاه نیست.';
    }
    const caps = CHANNEL_CAPABILITIES[channel];
    const lines = products.map((p) =>
      formatProduct(caps, {
        title: p.title,
        sku: p.sku,
        priceLabel: `${p.finalPrice.toLocaleString('fa-IR')} ${p.currency}`,
      }),
    );
    return `چند کالا از فروشگاه:\n\n${lines.join('\n\n')}\n\nنام یا کد کالا را بفرستید تا به سبد اضافه شود.`;
  }

  async myOrders(tenantId: string, conversationId: string): Promise<string> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
    });
    if (!conversation?.customerId) {
      return 'برای دیدن سفارش‌ها ابتدا یک خرید انجام دهید یا شماره موبایل را در گفتگو بفرستید.';
    }
    const orders = await this.prisma.storefrontOrder.findMany({
      where: { tenantId, customerId: conversation.customerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    if (!orders.length) {
      return 'سفارشی برای این حساب ثبت نشده است.';
    }
    const lines = orders.map((o) => {
      const amount = Number(o.totalAmount).toLocaleString('fa-IR');
      return `• ${o.orderNumber} — ${o.status} — ${amount} ${o.currency}`;
    });
    return `آخرین سفارش‌ها:\n${lines.join('\n')}\n\nبرای جزئیات، شماره سفارش را بفرستید.`;
  }
}
