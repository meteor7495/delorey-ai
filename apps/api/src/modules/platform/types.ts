export type AiEmployeeState =
  | 'inactive'
  | 'active'
  | 'paused'
  | 'syncing'
  | 'degraded'
  | 'awaiting_human';

export type SyncHealth = 'healthy' | 'stale' | 'failed' | 'never';

export type EscalationReason =
  | 'customer_request'
  | 'blocked_topic'
  | 'low_confidence'
  | 'discount_cap'
  | 'sync_unhealthy'
  | 'skill_escalate'
  | 'operator_manual';

export type HandoffPacket = {
  reason: EscalationReason;
  reasonLabel: string;
  lastMessages: Array<{ role: string; content: string; createdAt: string }>;
  citations: Array<{ sku: string; title: string; price: number }>;
  intentSummary: string | null;
  createdAt: string;
};

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
}

export interface Membership {
  userId: string;
  tenantId: string;
  role: 'owner' | 'operator' | 'viewer';
}

export interface Session {
  token: string;
  userId: string;
  tenantId: string;
  expiresAt: string;
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  title: string;
  price: number;
  currency: string;
  inStock: boolean;
  description?: string;
}

export interface Employee {
  id: string;
  tenantId: string;
  name: string;
  tone: string;
  language: string;
  status: AiEmployeeState;
  skills: {
    product_search: boolean;
    recommend: boolean;
    order_status: boolean;
    escalate: boolean;
  };
}

export interface ChannelBinding {
  id: string;
  tenantId: string;
  channel: 'website' | 'telegram' | 'bale';
  status: 'connected' | 'disconnected' | 'degraded';
  publicKey: string;
  allowedOrigins: string[];
}

export interface Conversation {
  id: string;
  tenantId: string;
  channel: 'website';
  ownership: 'ai_owned' | 'human_owned';
  escalationReason: EscalationReason | null;
  escalatedAt: string | null;
  handoffPacket: HandoffPacket | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  tenantId: string;
  role: 'shopper' | 'employee' | 'system' | 'operator';
  content: string;
  createdAt: string;
  citations?: Array<{ sku: string; title: string; price: number }>;
}

export interface AuditTurn {
  id: string;
  tenantId: string;
  conversationId: string;
  decision: string;
  citations: Array<{ sku: string; title: string; price: number }>;
  createdAt: string;
}

export interface StoreConnection {
  tenantId: string;
  platform: 'mock' | 'shopify' | 'woocommerce';
  syncHealth: SyncHealth;
  lastSyncAt: string | null;
  failureReason: string | null;
}

export const ESCALATION_LABELS: Record<EscalationReason, string> = {
  customer_request: 'درخواست مشتری برای انسان',
  blocked_topic: 'موضوع محدودشده',
  low_confidence: 'اطمینان پایین',
  discount_cap: 'بیش از سقف تخفیف',
  sync_unhealthy: 'ریسک داده همگام‌سازی',
  skill_escalate: 'ارجاع توسط مهارت',
  operator_manual: 'ارجاع دستی اپراتور',
};
