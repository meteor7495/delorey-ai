import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../platform/prisma.service';
import { DataStore } from '../platform/data.store';
import { DecisionService } from './decision.service';
import { AiActivityService } from './ai-activity.service';
import { OpportunityService } from './opportunity.service';

@Injectable()
export class CartRecoveryService {
  private readonly logger = new Logger(CartRecoveryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly store: DataStore,
    private readonly decision: DecisionService,
    private readonly activity: AiActivityService,
    private readonly opportunities: OpportunityService,
  ) {}

  /** Mark stale active carts as abandoned. */
  async markAbandonedCarts(tenantId: string) {
    const sales = await this.store.employeeForTenant(tenantId, 'sales');
    const hours = sales?.guardrails.cartAbandonHours ?? 2;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await this.prisma.cart.updateMany({
      where: {
        tenantId,
        status: 'active',
        updatedAt: { lt: cutoff },
        items: { some: {} },
      },
      data: { status: 'abandoned' },
    });
    if (result.count > 0) {
      await this.activity.record({
        tenantId,
        employeeId: sales?.id,
        actorType: 'system',
        action: 'cart.mark_abandoned',
        result: 'success',
        outputSanitized: { count: result.count, hours },
      });
    }
    return result.count;
  }

  async recoverCart(tenantId: string, cartId: string, force = false) {
    const sales = await this.store.employeeForTenant(tenantId, 'sales');
    if (!sales) return { status: 'rejected' as const, reason: 'no_sales_employee' };

    const cart = await this.prisma.cart.findFirst({
      where: { id: cartId, tenantId },
      include: { items: true, customer: true },
    });
    if (!cart || cart.status !== 'abandoned') {
      return { status: 'rejected' as const, reason: 'cart_not_abandoned' };
    }

    const maxPerWeek = sales.guardrails.cartRecoveryMaxPerWeek ?? 2;
    if (cart.customerId && maxPerWeek >= 0) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const prior = await this.prisma.cartRecoveryRun.count({
        where: {
          tenantId,
          customerId: cart.customerId,
          status: 'sent',
          createdAt: { gte: weekAgo },
        },
      });
      if (prior >= maxPerWeek) {
        await this.prisma.cartRecoveryRun.create({
          data: {
            id: uuid(),
            tenantId,
            cartId: cart.id,
            customerId: cart.customerId,
            employeeId: sales.id,
            status: 'skipped',
            strategy: 'frequency_limit',
            errorMessage: `max ${maxPerWeek} recovery messages / 7d`,
          },
        });
        await this.activity.record({
          tenantId,
          employeeId: sales.id,
          actorType: 'policy',
          action: 'cart_recovery.frequency_limit',
          result: 'skipped',
          inputSanitized: { cartId, prior, maxPerWeek },
        });
        return { status: 'skipped' as const, reason: 'frequency_limit' };
      }
    }

    const reminderIndex =
      (await this.prisma.cartRecoveryRun.count({
        where: { tenantId, cartId: cart.id, status: 'sent' },
      })) + 1;

    const cartValue = cart.items.reduce(
      (s, i) => s + Number(i.lineTotalSnapshot ?? i.unitPriceSnapshot ?? 0),
      0,
    );
    const strategy =
      cartValue > 5_000_000
        ? 'high_value_personal'
        : reminderIndex === 1
          ? 'gentle_reminder'
          : 'value_nudge';

    const messagePreview = this.buildMessage(strategy, cartValue);

    const decision = await this.decision.decideAndExecute({
      tenantId,
      role: 'sales',
      forceApprove: force,
      candidate: {
        action: 'cart_recovery.send',
        title: 'بازیابی سبد رها شده',
        description: messagePreview,
        kind: 'recovery',
        risk: 'MEDIUM',
        auditClass: 'communication',
        payload: {
          cartId: cart.id,
          customerId: cart.customerId,
          channel: cart.channel,
          strategy,
          messagePreview,
          reminderIndex,
        },
      },
    });

    if (decision.status === 'pending_approval') {
      await this.prisma.cartRecoveryRun.create({
        data: {
          id: uuid(),
          tenantId,
          cartId: cart.id,
          customerId: cart.customerId,
          employeeId: sales.id,
          status: 'pending',
          channel: cart.channel,
          reminderIndex,
          strategy,
          messagePreview,
        },
      });
      return decision;
    }

    if (decision.status === 'executed') {
      // Record send — actual channel delivery uses notification outbox pattern
      await this.prisma.notificationOutbox
        .create({
          data: {
            id: uuid(),
            tenantId,
            channel: cart.channel || 'telegram',
            kind: 'cart_recovery',
            body: messagePreview,
            status: 'pending',
          },
        })
        .catch((err) => {
          this.logger.warn(`notification outbox failed: ${err}`);
        });

      await this.prisma.cartRecoveryRun.create({
        data: {
          id: uuid(),
          tenantId,
          cartId: cart.id,
          customerId: cart.customerId,
          employeeId: sales.id,
          status: 'sent',
          channel: cart.channel,
          reminderIndex,
          strategy,
          messagePreview,
        },
      });
      return decision;
    }

    return decision;
  }

  async runTenantRecoveryScan(tenantId: string) {
    const marked = await this.markAbandonedCarts(tenantId);
    await this.opportunities.scan(tenantId);
    const carts = await this.prisma.cart.findMany({
      where: { tenantId, status: 'abandoned' },
      take: 20,
    });
    const results = [];
    for (const cart of carts) {
      results.push(await this.recoverCart(tenantId, cart.id));
    }
    return { marked, results };
  }

  private buildMessage(strategy: string, cartValue: number): string {
    const value = cartValue.toLocaleString('fa-IR');
    if (strategy === 'high_value_personal') {
      return `سبد خرید شما به ارزش حدود ${value} تومان هنوز منتظر است. اگر کمک می‌خواهید بگویید.`;
    }
    if (strategy === 'value_nudge') {
      return `یادآوری: سبد خریدتان (~${value} تومان) هنوز تکمیل نشده. آماده‌ایم کمکتان کنیم.`;
    }
    return `سبد خریدتان هنوز باز است. اگر سوالی دارید بپرسید تا کمکتان کنیم.`;
  }
}
