import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import {
  assertTransition,
  canonicalizeOrderStatus,
  isPaidFulfillmentStatus,
  normalizeRejectionReason,
  shouldRestockInventory,
  type PaymentStatus,
} from './domain';
import { InventoryService } from './inventory.service';
import { NotificationService } from './notification.service';

const ORDER_INCLUDE = {
  items: true,
  history: { orderBy: { createdAt: 'asc' as const } },
} satisfies Prisma.StorefrontOrderInclude;

export type StorefrontOrderWithHistory = Prisma.StorefrontOrderGetPayload<{
  include: typeof ORDER_INCLUDE;
}>;

@Injectable()
export class OrderWorkflowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly notifications: NotificationService,
  ) {}

  async get(tenantId: string, orderId: string): Promise<StorefrontOrderWithHistory> {
    const row = await this.prisma.storefrontOrder.findFirst({
      where: { id: orderId, tenantId },
      include: ORDER_INCLUDE,
    });
    if (!row) throw new NotFoundException('سفارش پیدا نشد');
    return row;
  }

  async transition(input: {
    tenantId: string;
    orderId: string;
    to: string;
    actorUserId?: string | null;
    reason?: string | null;
    paymentStatus?: PaymentStatus;
    paymentRef?: string | null;
    rejectionReason?: string | null;
  }): Promise<StorefrontOrderWithHistory> {
    const existing = await this.prisma.storefrontOrder.findFirst({
      where: { id: input.orderId, tenantId: input.tenantId },
    });
    if (!existing) throw new NotFoundException('سفارش پیدا نشد');

    const from = canonicalizeOrderStatus(existing.status);
    const to = canonicalizeOrderStatus(input.to);
    assertTransition(from, to);

    if (from === to && !input.paymentStatus && !input.paymentRef) {
      return this.get(input.tenantId, input.orderId);
    }

    const restock = shouldRestockInventory(from, to);
    const paymentStatus = input.paymentStatus ?? existing.paymentStatus;
    const rejectionReason =
      to === 'rejected'
        ? (input.rejectionReason ?? existing.rejectionReason)
        : existing.rejectionReason;

    await this.prisma.$transaction(async (tx) => {
      await tx.storefrontOrder.update({
        where: { id: existing.id },
        data: {
          status: to,
          paymentStatus,
          ...(input.paymentRef ? { paymentRef: input.paymentRef } : {}),
          ...(to === 'rejected' ? { rejectionReason } : {}),
        },
      });
      await tx.orderStatusHistory.create({
        data: {
          tenantId: existing.tenantId,
          orderId: existing.id,
          fromStatus: from,
          toStatus: to,
          paymentStatus,
          reason: input.reason ?? input.rejectionReason ?? null,
          actorUserId: input.actorUserId ?? null,
        },
      });
    });

    if (restock) {
      await this.inventory.restockOrder(
        existing.tenantId,
        existing.id,
        existing.orderNumber,
      );
    }

    const updated = await this.get(input.tenantId, input.orderId);
    try {
      await this.notifications.onOrderTransition(updated);
    } catch {
      /* outbox/analytics must not block the order mutation */
    }
    return updated;
  }

  async approve(
    tenantId: string,
    orderId: string,
    actorUserId?: string | null,
  ): Promise<StorefrontOrderWithHistory> {
    return this.transition({
      tenantId,
      orderId,
      to: 'approved',
      actorUserId,
      reason: 'admin_approve',
    });
  }

  async reject(
    tenantId: string,
    orderId: string,
    reason: string,
    actorUserId?: string | null,
  ): Promise<StorefrontOrderWithHistory> {
    const rejectionReason = normalizeRejectionReason(reason);
    return this.transition({
      tenantId,
      orderId,
      to: 'rejected',
      actorUserId,
      reason: rejectionReason,
      rejectionReason,
    });
  }

  async markPaid(
    tenantId: string,
    orderId: string,
    paymentRef: string,
    actorUserId?: string | null,
  ): Promise<StorefrontOrderWithHistory> {
    const existing = await this.prisma.storefrontOrder.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!existing) throw new NotFoundException('سفارش پیدا نشد');

    if (
      existing.paymentStatus === 'paid' &&
      isPaidFulfillmentStatus(existing.status)
    ) {
      return this.get(tenantId, orderId);
    }

    return this.transition({
      tenantId,
      orderId,
      to: 'pending_approval',
      actorUserId,
      reason: 'payment_completed',
      paymentStatus: 'paid',
      paymentRef,
    });
  }

  async markPaymentFailed(
    tenantId: string,
    orderId: string,
    actorUserId?: string | null,
  ): Promise<StorefrontOrderWithHistory> {
    const existing = await this.prisma.storefrontOrder.findFirst({
      where: { id: orderId, tenantId },
    });
    if (!existing) throw new NotFoundException('سفارش پیدا نشد');

    if (existing.paymentStatus === 'paid' && isPaidFulfillmentStatus(existing.status)) {
      return this.get(tenantId, orderId);
    }
    if (
      canonicalizeOrderStatus(existing.status) === 'payment_failed' ||
      canonicalizeOrderStatus(existing.status) === 'cancelled'
    ) {
      return this.get(tenantId, orderId);
    }

    return this.transition({
      tenantId,
      orderId,
      to: 'payment_failed',
      actorUserId,
      reason: 'payment_failed',
      paymentStatus: 'failed',
    });
  }

  async recordCreated(
    tx: Prisma.TransactionClient,
    input: {
      tenantId: string;
      orderId: string;
      status: string;
      paymentStatus: string;
    },
  ) {
    await tx.orderStatusHistory.create({
      data: {
        tenantId: input.tenantId,
        orderId: input.orderId,
        fromStatus: 'draft',
        toStatus: input.status,
        paymentStatus: input.paymentStatus,
        reason: 'order_created',
      },
    });
  }
}
