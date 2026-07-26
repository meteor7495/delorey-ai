import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';

@Injectable()
export class CommerceService {
  constructor(private readonly store: DataStore) {}

  async getStore(tenantId: string) {
    const connection = await this.store.getStore(tenantId);
    if (!connection) throw new NotFoundException('Store not connected');
    const products = await this.store.productsForTenant(tenantId);
    return {
      ...connection,
      productCount: products.length,
    };
  }

  async mockConnect(tenantId: string) {
    const existing = await this.store.getStore(tenantId);
    if (!existing) {
      await this.store.provisionTenantDefaults(tenantId);
    } else {
      await this.store.upsertHealthyStore(tenantId);
    }
    return this.getStore(tenantId);
  }

  async listProducts(tenantId: string) {
    return this.store.productsForTenant(tenantId);
  }

  async getWebsiteChannel(tenantId: string) {
    const channel = await this.store.websiteChannel(tenantId);
    if (!channel) throw new NotFoundException('Website channel missing');
    const snippet = `<script src="http://localhost:5173/embed.js" data-public-key="${channel.publicKey}" async></script>`;
    return { ...channel, snippet };
  }

  async searchProducts(tenantId: string, query: string) {
    const q = query.trim().toLowerCase();
    const products = await this.store.productsForTenant(tenantId);
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
