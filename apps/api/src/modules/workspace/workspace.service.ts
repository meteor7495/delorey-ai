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
    const publishedCount = products.filter((p) => p.status !== 'draft').length;
    const escalatedCount = await this.store.countEscalated(tenantId);
    const path = await this.store.partnerPathStats(tenantId);

    let primaryAttention: { code: string; title: string; href: string } | null =
      null;
    if (publishedCount === 0) {
      primaryAttention = {
        code: 'catalog_empty',
        title: 'حداقل یک محصول در فروشگاه بومی منتشر کنید',
        href: '/shop/products',
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
        title: 'اولین گفتگوی grounded را روی ویجت یا ویترین امتحان کنید',
        href: '/channels',
      };
    }

    const onboarding = {
      catalogReady: publishedCount > 0,
      storeConnected: publishedCount > 0,
      syncHealthy: publishedCount > 0,
      employeeConfigured: Boolean(employee && employee.status === 'active'),
      channelConnected: channel?.status === 'connected',
      knowledgeReady: path.activeKnowledge > 0,
      firstChatDone: path.groundedTurns > 0 || path.websiteConversations > 0,
      handoffProven: path.escalatedEver > 0,
      auditVisible: path.anyAudit > 0,
    };

    const partnerReady =
      onboarding.catalogReady &&
      onboarding.employeeConfigured &&
      onboarding.channelConnected &&
      onboarding.firstChatDone &&
      onboarding.auditVisible;

    return {
      email,
      tenant,
      employeeStatus: employee?.status ?? 'inactive',
      syncHealth: publishedCount > 0 ? 'healthy' : (store?.syncHealth ?? 'never'),
      websiteChannelStatus: channel?.status ?? 'disconnected',
      productCount: publishedCount,
      escalatedCount,
      primaryAttention,
      onboarding,
      partnerReady,
      pathStats: path,
    };
  }
}
