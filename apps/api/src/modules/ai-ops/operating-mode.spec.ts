import { describe, expect, it } from 'vitest';
import { OperatingModeService } from './operating-mode.service';
import { EmployeePermissionService } from './employee-permission.service';
import type { Employee } from '../platform/types';
import { DEFAULT_GUARDRAILS } from '../platform/types';

function emp(overrides: Partial<Employee> = {}): Employee {
  return {
    id: 'e1',
    tenantId: 't1',
    role: 'sales',
    name: 'Sales',
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
    permissions: ['products.read', 'orders.read', 'customers.read'],
    goals: [],
    guardrails: DEFAULT_GUARDRAILS,
    ...overrides,
  };
}

describe('OperatingModeService', () => {
  const svc = new OperatingModeService();

  it('copilot requires approval for write/comms', () => {
    expect(svc.requiresApproval('copilot', 'LOW', 'communication')).toBe(true);
    expect(svc.requiresApproval('copilot', 'READ', 'read')).toBe(false);
  });

  it('assistant auto-allows LOW, requires MEDIUM+', () => {
    expect(svc.requiresApproval('assistant', 'LOW', 'write')).toBe(false);
    expect(svc.requiresApproval('assistant', 'MEDIUM', 'write')).toBe(true);
  });

  it('autopilot requires HIGH+', () => {
    expect(svc.requiresApproval('autopilot', 'MEDIUM', 'write')).toBe(false);
    expect(svc.requiresApproval('autopilot', 'HIGH', 'write')).toBe(true);
    expect(svc.requiresApproval('autopilot', 'CRITICAL', 'financial')).toBe(
      true,
    );
  });
});

describe('EmployeePermissionService', () => {
  const svc = new EmployeePermissionService();

  it('fail-closed when no permissions', () => {
    const e = emp({ permissions: [] });
    expect(svc.canUseTool(e, ['products.read'])).toBe(false);
    expect(svc.resolveScopes(e)).toEqual([]);
  });

  it('intersects allowlist with candidate scopes', () => {
    const e = emp();
    expect(svc.resolveScopes(e, ['products.read', 'orders.refund'])).toEqual([
      'products.read',
    ]);
  });

  it('rejects tool when missing required permission', () => {
    const e = emp();
    expect(svc.canUseTool(e, ['orders.refund'])).toBe(false);
    expect(svc.canUseTool(e, ['products.read'])).toBe(true);
  });
});
