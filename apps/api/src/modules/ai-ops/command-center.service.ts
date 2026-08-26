import { Injectable } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import { PrismaService } from '../platform/prisma.service';
import { OpportunityService } from './opportunity.service';
import { AiActivityService } from './ai-activity.service';
import { DecisionService } from './decision.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class CommandCenterService {
  constructor(
    private readonly store: DataStore,
    private readonly prisma: PrismaService,
    private readonly opportunities: OpportunityService,
    private readonly activity: AiActivityService,
    private readonly decisions: DecisionService,
    private readonly analytics: AnalyticsService,
  ) {}

  async get(tenantId: string, email: string) {
    await this.store.provisionTenantDefaults(tenantId);
    await this.opportunities.scan(tenantId).catch(() => null);

    const [
      employees,
      opportunitySummary,
      recentActivity,
      pendingApprovals,
      unpaidOrders,
      escalatedCount,
      abandonedCarts,
      lowStockCount,
      summary,
      revenue,
    ] = await Promise.all([
      this.store.employeesForTenant(tenantId),
      this.opportunities.summarize(tenantId),
      this.activity.listForTenant(tenantId, { limit: 20 }),
      this.decisions.listApprovals(tenantId, 'pending'),
      this.prisma.storefrontOrder.count({
        where: {
          tenantId,
          OR: [
            { paymentStatus: 'unpaid' },
            { status: { in: ['pending_payment', 'pending_approval'] } },
          ],
        },
      }),
      this.store.countEscalated(tenantId),
      this.prisma.cart.count({ where: { tenantId, status: 'abandoned' } }),
      this.countLowStock(tenantId),
      this.analytics.summary(tenantId, 7),
      this.analytics.revenue(tenantId, 7),
    ]);

    const attention = [
      unpaidOrders > 0
        ? {
            code: 'unpaid_orders',
            title: `${unpaidOrders} سفارش نیاز به توجه دارد`,
            count: unpaidOrders,
            href: '/shop/orders',
            actionHint: 'بررسی سفارش‌های پرداخت‌نشده',
            executableAction: null as string | null,
          }
        : null,
      escalatedCount > 0
        ? {
            code: 'escalations',
            title: `${escalatedCount} گفتگو در انتظار انسان`,
            count: escalatedCount,
            href: '/inbox?ownership=human_owned',
            actionHint: 'پاسخ در اینباکس',
            executableAction: null,
          }
        : null,
      abandonedCarts > 0
        ? {
            code: 'abandoned_carts',
            title: `${abandonedCarts} سبد رها شده`,
            count: abandonedCarts,
            href: '/opportunities',
            actionHint: 'بازیابی با هوش مصنوعی',
            executableAction: 'recover_abandoned_carts',
          }
        : null,
      lowStockCount > 0
        ? {
            code: 'low_stock',
            title: `${lowStockCount} محصول کم‌موجودی`,
            count: lowStockCount,
            href: '/shop/inventory',
            actionHint: 'بررسی موجودی',
            executableAction: null,
          }
        : null,
      pendingApprovals.length > 0
        ? {
            code: 'approvals',
            title: `${pendingApprovals.length} تأیید در انتظار`,
            count: pendingApprovals.length,
            href: '/approvals',
            actionHint: 'بررسی تأییدها',
            executableAction: null,
          }
        : null,
    ].filter(Boolean);

    const employeeStrip = await Promise.all(
      employees.map(async (e) => {
        const perf = await this.activity.performanceForEmployee(
          tenantId,
          e.id,
        );
        return {
          id: e.id,
          role: e.role,
          name: e.name,
          status: e.status,
          operatingMode: e.operatingMode,
          performance: perf,
        };
      }),
    );

    return {
      email,
      greeting: 'سلام',
      attention,
      opportunities: opportunitySummary,
      employees: employeeStrip,
      pendingApprovals: pendingApprovals.slice(0, 10),
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        employeeId: a.employeeId,
        actorType: a.actorType,
        action: a.action,
        tool: a.tool,
        result: a.result,
        createdAt: a.createdAt,
      })),
      business: {
        summary,
        revenue,
      },
      aiTasksCompleted: recentActivity.filter((a) => a.result === 'success')
        .length,
    };
  }

  private async countLowStock(tenantId: string) {
    const levels = await this.prisma.inventoryLevel.findMany({
      where: { tenantId },
      select: { onHand: true, reserved: true, lowStockThreshold: true },
    });
    return levels.filter((l) => l.onHand - l.reserved <= l.lowStockThreshold)
      .length;
  }
}
