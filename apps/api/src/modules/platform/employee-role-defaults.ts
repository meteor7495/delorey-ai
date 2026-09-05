import type {
  EmployeeGuardrails,
  EmployeeOperatingMode,
  EmployeeRole,
} from './types';
import { DEFAULT_GUARDRAILS } from './types';

type EmployeeSkills = {
  product_search: boolean;
  recommend: boolean;
  order_status: boolean;
  escalate: boolean;
};

export type EmployeeRoleSeed = {
  role: EmployeeRole;
  name: string;
  tone: string;
  operatingMode: EmployeeOperatingMode;
  instructions: string;
  skills: EmployeeSkills;
  permissions: string[];
  goals: string[];
  guardrails: EmployeeGuardrails;
};

const SALES_PERMISSIONS = [
  'products.read',
  'inventory.read',
  'orders.read',
  'customers.read',
  'customers.write',
  'payments.read',
  'payments.write',
  'knowledge.read',
  'channels.read',
  'agents.read',
];

const SUPPORT_PERMISSIONS = [
  'products.read',
  'orders.read',
  'customers.read',
  'knowledge.read',
  'knowledge.write',
  'channels.read',
  'agents.read',
];

const MARKETING_PERMISSIONS = [
  'customers.read',
  'marketing.read',
  'marketing.write',
  'analytics.read',
  'knowledge.read',
  'agents.read',
];

const ANALYST_PERMISSIONS = [
  'products.read',
  'orders.read',
  'customers.read',
  'inventory.read',
  'analytics.read',
  'knowledge.read',
  'agents.read',
];

const OPERATIONS_PERMISSIONS = [
  'products.read',
  'inventory.read',
  'inventory.write',
  'orders.read',
  'orders.update',
  'customers.read',
  'analytics.read',
  'agents.read',
];

export const EMPLOYEE_ROLE_SEEDS: EmployeeRoleSeed[] = [
  {
    role: 'sales',
    name: 'دستیار هوشمند فروش',
    tone: 'مودب و مستقیم',
    operatingMode: 'assistant',
    instructions:
      'شما دستیار هوشمند فروش هستید. فقط از ابزارهای تأییدشده برای قیمت، موجودی و سفارش استفاده کنید. هرگز داده تجاری را حدس نزنید.',
    skills: {
      product_search: true,
      recommend: true,
      order_status: true,
      escalate: true,
    },
    permissions: SALES_PERMISSIONS,
    goals: ['lead_qualification', 'upsell', 'cart_recovery', 'order_creation'],
    guardrails: DEFAULT_GUARDRAILS,
  },
  {
    role: 'support',
    name: 'دستیار هوشمند پشتیبانی',
    tone: 'آرام و همدل',
    operatingMode: 'copilot',
    instructions:
      'شما دستیار هوشمند پشتیبانی هستید. وضعیت سفارش و سیاست‌ها را از ابزارها بخوانید. بازپرداخت و لغو را بدون تأیید انسانی انجام ندهید.',
    skills: {
      product_search: true,
      recommend: false,
      order_status: true,
      escalate: true,
    },
    permissions: SUPPORT_PERMISSIONS,
    goals: ['answer_questions', 'order_status', 'escalation'],
    guardrails: DEFAULT_GUARDRAILS,
  },
  {
    role: 'marketing',
    name: 'دستیار هوشمند بازاریابی',
    tone: 'خلاق و مختصر',
    operatingMode: 'copilot',
    instructions:
      'شما دستیار هوشمند بازاریابی هستید. کمپین‌ها را به‌صورت پیش‌نویس بسازید؛ ارسال انبوه فقط پس از تأیید.',
    skills: {
      product_search: false,
      recommend: false,
      order_status: false,
      escalate: true,
    },
    permissions: MARKETING_PERMISSIONS,
    goals: ['campaign_draft', 'segmentation', 'copy'],
    guardrails: DEFAULT_GUARDRAILS,
  },
  {
    role: 'analyst',
    name: 'دستیار هوشمند تحلیل',
    tone: 'دقیق و مبتنی بر داده',
    operatingMode: 'copilot',
    instructions:
      'شما دستیار هوشمند تحلیل هستید. فقط از داده‌های فروش و گزارش‌های خواندنی استفاده کنید و اقدامات اجرایی پیشنهاد دهید.',
    skills: {
      product_search: true,
      recommend: false,
      order_status: false,
      escalate: false,
    },
    permissions: ANALYST_PERMISSIONS,
    goals: ['revenue_analysis', 'anomaly_detection', 'recommendations'],
    guardrails: DEFAULT_GUARDRAILS,
  },
  {
    role: 'operations',
    name: 'دستیار هوشمند عملیات',
    tone: 'عملیاتی و شفاف',
    operatingMode: 'assistant',
    instructions:
      'شما دستیار هوشمند عملیات هستید. موجودی و سفارش‌ها را پایش کنید؛ تغییرات پرریسک نیاز به تأیید دارند.',
    skills: {
      product_search: true,
      recommend: false,
      order_status: true,
      escalate: true,
    },
    permissions: OPERATIONS_PERMISSIONS,
    goals: ['inventory_monitor', 'fulfillment', 'low_stock_alerts'],
    guardrails: DEFAULT_GUARDRAILS,
  },
];

export function seedForRole(role: EmployeeRole): EmployeeRoleSeed {
  const found = EMPLOYEE_ROLE_SEEDS.find((s) => s.role === role);
  if (!found) throw new Error(`Unknown employee role: ${role}`);
  return found;
}
