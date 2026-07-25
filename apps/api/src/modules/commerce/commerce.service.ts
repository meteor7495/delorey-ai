import { Injectable, NotFoundException } from '@nestjs/common';
import { MemoryStore } from '../platform/memory.store';

@Injectable()
export class CommerceService {
  constructor(private readonly store: MemoryStore) {}

  getStore(tenantId: string) {
    const connection = this.store.stores.get(tenantId);
    if (!connection) throw new NotFoundException('Store not connected');
    return {
      ...connection,
      productCount: this.store.productsForTenant(tenantId).length,
    };
  }

  mockConnect(tenantId: string) {
    if (!this.store.stores.get(tenantId)) {
      this.store.provisionTenantDefaults(tenantId);
    } else {
      const s = this.store.stores.get(tenantId)!;
      s.syncHealth = 'healthy';
      s.lastSyncAt = new Date().toISOString();
      s.failureReason = null;
      this.store.stores.set(tenantId, s);
    }
    return this.getStore(tenantId);
  }

  listProducts(tenantId: string) {
    return this.store.productsForTenant(tenantId);
  }

  getWebsiteChannel(tenantId: string) {
    const channel = this.store.websiteChannel(tenantId);
    if (!channel) throw new NotFoundException('Website channel missing');
    const snippet = `<script src="http://localhost:5173/embed.js" data-public-key="${channel.publicKey}" async></script>`;
    return { ...channel, snippet };
  }

  searchProducts(tenantId: string, query: string) {
    const q = query.trim().toLowerCase();
    const products = this.store.productsForTenant(tenantId);
    if (!q) return products.slice(0, 5);

    const tokens = q
      .split(/[\s,?!.;:،؟]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);

    return products.filter((p) => {
      const hay = `${p.title} ${p.sku} ${p.description ?? ''}`.toLowerCase();
      if (hay.includes(q)) return true;
      return tokens.some(
        (t) => hay.includes(t) || p.sku.toLowerCase().includes(t),
      );
    });
  }
}
