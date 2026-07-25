import { Injectable, OnModuleInit } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as bcrypt from 'bcryptjs';
import type {
  AuditTurn,
  ChannelBinding,
  Conversation,
  Employee,
  Membership,
  Message,
  Product,
  Session,
  StoreConnection,
  Tenant,
  User,
} from './types';

/**
 * Slice 01 in-memory SoR. Replace with Postgres repositories (Database Design)
 * without changing module boundaries.
 */
@Injectable()
export class MemoryStore implements OnModuleInit {
  users = new Map<string, User>();
  usersByEmail = new Map<string, string>();
  tenants = new Map<string, Tenant>();
  memberships: Membership[] = [];
  sessions = new Map<string, Session>();
  products = new Map<string, Product>();
  employees = new Map<string, Employee>();
  channels = new Map<string, ChannelBinding>();
  conversations = new Map<string, Conversation>();
  messages: Message[] = [];
  audits: AuditTurn[] = [];
  stores = new Map<string, StoreConnection>();

  async onModuleInit() {
    // Demo seed for local vertical slice — optional; signup also provisions.
    const email = 'demo@delorey.local';
    if (!this.usersByEmail.has(email)) {
      await this.seedDemo(email);
    }
  }

  private async seedDemo(email: string) {
    const userId = uuid();
    const tenantId = uuid();
    const passwordHash = await bcrypt.hash('demo1234', 8);
    this.users.set(userId, {
      id: userId,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
    });
    this.usersByEmail.set(email, userId);
    this.tenants.set(tenantId, {
      id: tenantId,
      name: 'فروشگاه دمو',
      ownerUserId: userId,
      createdAt: new Date().toISOString(),
    });
    this.memberships.push({ userId, tenantId, role: 'owner' });
    this.provisionTenantDefaults(tenantId);
  }

  provisionTenantDefaults(tenantId: string) {
    const employeeId = uuid();
    this.employees.set(employeeId, {
      id: employeeId,
      tenantId,
      name: 'کارمند فروش',
      tone: 'مودب و مستقیم',
      language: 'fa',
      status: 'active',
      skills: {
        product_search: true,
        recommend: true,
        order_status: false,
        escalate: true,
      },
    });

    this.stores.set(tenantId, {
      tenantId,
      platform: 'mock',
      syncHealth: 'healthy',
      lastSyncAt: new Date().toISOString(),
      failureReason: null,
    });

    const catalog: Array<Omit<Product, 'id' | 'tenantId'>> = [
      {
        sku: 'SHIRT-001',
        title: 'پیراهن لینن آبی',
        price: 890000,
        currency: 'IRR',
        inStock: true,
        description: 'سایزهای M و L موجود',
      },
      {
        sku: 'BAG-014',
        title: 'کیف چرمی مشکی',
        price: 2450000,
        currency: 'IRR',
        inStock: true,
      },
      {
        sku: 'SHOE-220',
        title: 'کفش اسپرت سفید',
        price: 1750000,
        currency: 'IRR',
        inStock: false,
        description: 'فعلاً ناموجود',
      },
    ];

    for (const item of catalog) {
      const id = uuid();
      this.products.set(id, { id, tenantId, ...item });
    }

    const publicKey = `pk_live_${tenantId.slice(0, 8)}`;
    const channelId = uuid();
    this.channels.set(channelId, {
      id: channelId,
      tenantId,
      channel: 'website',
      status: 'connected',
      publicKey,
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ],
    });
  }

  productsForTenant(tenantId: string): Product[] {
    return [...this.products.values()].filter((p) => p.tenantId === tenantId);
  }

  employeeForTenant(tenantId: string): Employee | undefined {
    return [...this.employees.values()].find((e) => e.tenantId === tenantId);
  }

  websiteChannel(tenantId: string): ChannelBinding | undefined {
    return [...this.channels.values()].find(
      (c) => c.tenantId === tenantId && c.channel === 'website',
    );
  }

  channelByPublicKey(publicKey: string): ChannelBinding | undefined {
    return [...this.channels.values()].find((c) => c.publicKey === publicKey);
  }
}
