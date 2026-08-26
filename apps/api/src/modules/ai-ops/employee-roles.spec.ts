import { describe, expect, it } from 'vitest';
import { EMPLOYEE_ROLE_SEEDS } from '../platform/employee-role-defaults';

describe('multi-employee seeds', () => {
  it('seeds five distinct roles', () => {
    const roles = EMPLOYEE_ROLE_SEEDS.map((s) => s.role);
    expect(roles).toEqual([
      'sales',
      'support',
      'marketing',
      'analyst',
      'operations',
    ]);
  });

  it('sales has product read; marketing has marketing.write', () => {
    const sales = EMPLOYEE_ROLE_SEEDS.find((s) => s.role === 'sales')!;
    const marketing = EMPLOYEE_ROLE_SEEDS.find((s) => s.role === 'marketing')!;
    expect(sales.permissions).toContain('products.read');
    expect(marketing.permissions).toContain('marketing.write');
    expect(sales.permissions).not.toContain('orders.refund');
  });
});
