import { Injectable } from '@nestjs/common';
import type { McpPermission } from '../mcp/core/types';
import type { Employee } from '../platform/types';

@Injectable()
export class EmployeePermissionService {
  /** Intersection of employee allowlist with candidate scopes (fail closed). */
  resolveScopes(
    employee: Employee,
    candidateScopes?: McpPermission[],
  ): McpPermission[] {
    const allow = new Set(
      (employee.permissions ?? []).filter(
        (p): p is McpPermission => typeof p === 'string' && p.includes('.'),
      ),
    );
    if (allow.size === 0) return [];
    if (!candidateScopes || candidateScopes.length === 0) {
      return [...allow];
    }
    return candidateScopes.filter((s) => allow.has(s));
  }

  hasPermission(employee: Employee, permission: McpPermission): boolean {
    return (employee.permissions ?? []).includes(permission);
  }

  canUseTool(
    employee: Employee,
    requiredPermissions: McpPermission[],
  ): boolean {
    if (!requiredPermissions.length) return true;
    return requiredPermissions.every((p) => this.hasPermission(employee, p));
  }
}
