import { Injectable } from '@nestjs/common';
import { DataStore } from '../platform/data.store';

@Injectable()
export class WorkspaceService {
  constructor(private readonly store: DataStore) {}

  async getHome(tenantId: string, email: string) {
    const tenant = await this.store.findTenant(tenantId);
    const store = await this.store.getStore(tenantId);
    const employee = await this.store.employeeForTenant(tenantId);
    const channel = await this.store.websiteChannel(tenantId);
    const products = await this.store.productsForTenant(tenantId);
    const escalatedCount = await this.store.countEscalated(tenantId);
    const path = await this.store.partnerPathStats(tenantId);

    let primaryAttention: { code: string; title: string; href: string } | null =
      null;
    if (!store || store.syncHealth !== 'healthy') {
      primaryAttention = {
        code: 'sync_unhealthy',
        title: 'همگام‌سازی فروشگاه نیاز به بررسی دارد',
        href: '/store',
      };
    } else if (escalatedCount > 0) {
      primaryAttention = {
        code: 'escalations',
        title: `${escalatedCount} گفتگو در انتظار پاسخ انسانی است`,
        href: '/inbox?ownership=human_owned',
      };
    } else if (!channel || channel.status !== 'connected') {
      primaryAttention = {
        code: 'channel_missing',
        title: 'یک کانال را متصل کنید',
        href: '/channels',
      };
    } else if (employee && employee.status !== 'active') {
      primaryAttention = {
        code: 'employee_paused',
        title: 'کارمند فروش فعال نیست',
        href: '/employee',
      };
    } else if (path.groundedTurns === 0) {
      primaryAttention = {
        code: 'first_chat',
        title: 'اولین گفتگوی grounded را روی ویجت امتحان کنید',
        href: '/channels',
      };
    }

    const onboarding = {
      storeConnected: Boolean(store),
      syncHealthy: store?.syncHealth === 'healthy',
      employeeConfigured: Boolean(employee && employee.status === 'active'),
      channelConnected: channel?.status === 'connected',
      knowledgeReady: path.activeKnowledge > 0,
      firstChatDone: path.groundedTurns > 0 || path.websiteConversations > 0,
      handoffProven: path.escalatedEver > 0,
      auditVisible: path.anyAudit > 0,
    };

    const partnerReady =
      onboarding.storeConnected &&
      onboarding.syncHealthy &&
      onboarding.employeeConfigured &&
      onboarding.channelConnected &&
      onboarding.firstChatDone &&
      onboarding.auditVisible;

    return {
      email,
      tenant,
      employeeStatus: employee?.status ?? 'inactive',
      syncHealth: store?.syncHealth ?? 'never',
      websiteChannelStatus: channel?.status ?? 'disconnected',
      productCount: products.length,
      escalatedCount,
      primaryAttention,
      onboarding,
      partnerReady,
      pathStats: path,
    };
  }
}
