import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import { PrismaService } from '../platform/prisma.service';
import { HandoffService } from './handoff.service';
import type { Conversation, EscalationReason } from '../platform/types';

@Injectable()
export class InboxService {
  constructor(
    private readonly store: DataStore,
    private readonly handoff: HandoffService,
    private readonly prisma: PrismaService,
  ) {}

  list(tenantId: string, ownership?: Conversation['ownership']) {
    return this.store.listConversations(
      tenantId,
      ownership ? { ownership } : undefined,
    );
  }

  async getThread(tenantId: string, conversationId: string) {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversation not found');
    }
    const messages = await this.store.listMessages(tenantId, conversationId);
    const context = await this.context(tenantId, conversation);
    return { conversation, messages, context };
  }

  private async context(
    tenantId: string,
    conversation: Conversation,
  ) {
    const customer = conversation.customerId
      ? await this.prisma.customer.findFirst({
          where: { id: conversation.customerId, tenantId },
          include: { addresses: { where: { isDefault: true }, take: 1 } },
        })
      : null;
    const sessionId = `${conversation.channel}:${conversation.id}`;
    const cart = await this.prisma.cart.findFirst({
      where: { tenantId, sessionId, status: 'active' },
      include: { items: { include: { product: { select: { title: true } } } } },
    });
    const orders = conversation.customerId
      ? await this.prisma.storefrontOrder.findMany({
          where: { tenantId, customerId: conversation.customerId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
        })
      : [];
    return {
      shoppingState: conversation.shoppingState,
      customer: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phoneNormalized,
            address: customer.addresses[0]?.line ?? null,
          }
        : null,
      memory: conversation.customerId
        ? await this.prisma.customerMemory.findFirst({
            where: { tenantId, customerId: conversation.customerId },
          })
        : null,
      cart: cart
        ? {
            itemCount: cart.items.length,
            items: cart.items.map((i) => ({
              title: i.product.title,
              quantity: i.quantity,
            })),
          }
        : null,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        totalAmount: Number(o.totalAmount),
        currency: o.currency,
        createdAt: o.createdAt.toISOString(),
      })),
    };
  }

  escalate(
    tenantId: string,
    conversationId: string,
    reason: EscalationReason,
  ) {
    return this.handoff.escalate(tenantId, conversationId, reason);
  }

  takeover(tenantId: string, conversationId: string) {
    return this.handoff.takeover(tenantId, conversationId);
  }

  release(tenantId: string, conversationId: string) {
    return this.handoff.release(tenantId, conversationId);
  }

  reply(tenantId: string, conversationId: string, text: string) {
    return this.handoff.operatorReply(tenantId, conversationId, text);
  }
}
