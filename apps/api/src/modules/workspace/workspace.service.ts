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
    }

    return {
      email,
      tenant,
      employeeStatus: employee?.status ?? 'inactive',
      syncHealth: store?.syncHealth ?? 'never',
      websiteChannelStatus: channel?.status ?? 'disconnected',
      productCount: products.length,
      escalatedCount,
      primaryAttention,
      onboarding: {
        storeConnected: Boolean(store),
        syncHealthy: store?.syncHealth === 'healthy',
        employeeConfigured: Boolean(employee),
        channelConnected: channel?.status === 'connected',
      },
    };
  }
}
