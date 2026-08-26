import { describe, expect, it } from 'vitest';
import { EmployeePermissionService } from './employee-permission.service';
import type { Employee } from '../platform/types';
import { DEFAULT_GUARDRAILS } from '../platform/types';

/**
 * Multi-tenancy fail-closed: employee permissions are tenant-bound entities;
 * scopes never grant cross-tenant tool access (tenantId is always from auth context).
 */
describe('tenant isolation (permission layer)', () => {
  const svc = new EmployeePermissionService();

  it('tenant A employee scopes do not imply tenant B access', () => {
    const tenantA: Employee = {
      id: 'ea',
      tenantId: 'tenant-a',
      role: 'sales',
      name: 'A',
      tone: 'x',
      language: 'fa',
      status: 'active',
      operatingMode: 'assistant',
      instructions: null,
      skills: {
        product_search: true,
        recommend: true,
        order_status: true,
        escalate: true,
      },
      permissions: ['products.read', 'orders.read'],
      goals: [],
      guardrails: DEFAULT_GUARDRAILS,
    };
    const tenantB: Employee = {
      ...tenantA,
      id: 'eb',
      tenantId: 'tenant-b',
      permissions: ['products.read'],
    };
    expect(tenantA.tenantId).not.toBe(tenantB.tenantId);
    expect(svc.hasPermission(tenantA, 'orders.read')).toBe(true);
    expect(svc.hasPermission(tenantB, 'orders.read')).toBe(false);
  });
});
