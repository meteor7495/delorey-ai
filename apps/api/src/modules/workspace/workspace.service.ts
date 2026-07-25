import { Injectable } from '@nestjs/common';
import { MemoryStore } from '../platform/memory.store';

@Injectable()
export class WorkspaceService {
  constructor(private readonly store: MemoryStore) {}

  getHome(tenantId: string, email: string) {
    const tenant = this.store.tenants.get(tenantId);
    const store = this.store.stores.get(tenantId);
    const employee = this.store.employeeForTenant(tenantId);
    const channel = this.store.websiteChannel(tenantId);
    const productCount = this.store.productsForTenant(tenantId).length;

    let primaryAttention: { code: string; title: string; href: string } | null =
      null;
    if (!store || store.syncHealth !== 'healthy') {
      primaryAttention = {
        code: 'sync_unhealthy',
        title: 'همگام‌سازی فروشگاه نیاز به بررسی دارد',
        href: '/store',
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
      productCount,
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
