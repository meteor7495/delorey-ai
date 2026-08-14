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
    const [telegram, bale, instagram, orderCount] = await Promise.all([
      this.store.telegramChannel(tenantId),
      this.store.baleChannel(tenantId),
      this.store.instagramChannel(tenantId),
      this.store.countStorefrontOrders(tenantId),
    ]);
    const messagingConnected = [telegram, bale, instagram].some(
      (c) => c?.status === 'connected',
    );

    let primaryAttention: { code: string; title: string; href: string } | null =
      null;
    if (publishedCount === 0) {
      primaryAttention = {
        code: 'catalog_empty',
        title: 'حداقل یک محصول در فروشگاه بومی منتشر کنید',
        href: '/shop/products',
      };
    } else if (!messagingConnected) {
      primaryAttention = {
        code: 'channel_missing',
        title: 'تلگرام، بله یا اینستاگرام را وصل کنید',
        href: '/channels',
      };
    } else if (orderCount === 0) {
      primaryAttention = {
        code: 'first_order',
        title: 'اولین سفارش را از ویترین یا کانال ثبت کنید',
        href: '/shop/orders',
      };
    } else if (escalatedCount > 0) {
      primaryAttention = {
        code: 'escalations',
        title: `${escalatedCount} گفتگو در انتظار پاسخ انسانی است`,
        href: '/inbox?ownership=human_owned',
      };
    }

    const onboarding = {
      catalogReady: publishedCount > 0,
      storeConnected: publishedCount > 0,
      syncHealthy: publishedCount > 0,
      employeeConfigured: Boolean(employee && employee.status === 'active'),
      channelConnected: messagingConnected,
      firstOrderDone: orderCount > 0,
      knowledgeReady: path.activeKnowledge > 0,
      firstChatDone: path.groundedTurns > 0 || path.websiteConversations > 0,
      handoffProven: path.escalatedEver > 0,
      auditVisible: path.anyAudit > 0,
    };

    const partnerReady = onboarding.catalogReady && onboarding.firstOrderDone;

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
