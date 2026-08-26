import { EventEmitter } from 'node:events';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import type {
  Employee,
  EmployeeGuardrails,
  EmployeeRole,
} from '../platform/types';
import { normalizeGuardrails } from '../platform/types';

/** In-process bus for `employee.updated` (Runtime loads config each turn). */
export const employeeEvents = new EventEmitter();

@Injectable()
export class EmployeeService {
  constructor(private readonly store: DataStore) {}

  async list(tenantId: string): Promise<Employee[]> {
    await this.store.provisionTenantDefaults(tenantId);
    return this.store.employeesForTenant(tenantId);
  }

  /** Backward-compatible: Sales employee */
  async get(tenantId: string): Promise<Employee> {
    return this.getByRole(tenantId, 'sales');
  }

  async getByRole(tenantId: string, role: EmployeeRole): Promise<Employee> {
    await this.store.provisionTenantDefaults(tenantId);
    const employee = await this.store.employeeForTenant(tenantId, role);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(
    tenantId: string,
    patch: Partial<
      Pick<
        Employee,
        | 'name'
        | 'tone'
        | 'language'
        | 'status'
        | 'operatingMode'
        | 'instructions'
        | 'permissions'
        | 'goals'
      > & {
        skills?: Partial<Employee['skills']>;
      }
    >,
  ): Promise<Employee> {
    return this.updateByRole(tenantId, 'sales', patch);
  }

  async updateByRole(
    tenantId: string,
    role: EmployeeRole,
    patch: Partial<
      Pick<
        Employee,
        | 'name'
        | 'tone'
        | 'language'
        | 'status'
        | 'operatingMode'
        | 'instructions'
        | 'permissions'
        | 'goals'
      > & {
        skills?: Partial<Employee['skills']>;
      }
    >,
  ): Promise<Employee> {
    await this.store.provisionTenantDefaults(tenantId);
    const employee = await this.store.updateEmployee(tenantId, patch, role);
    if (!employee) throw new NotFoundException('Employee not found');
    employeeEvents.emit('employee.updated', {
      tenantId,
      employeeId: employee.id,
      role,
    });
    return employee;
  }

  async updateGuardrails(
    tenantId: string,
    body: {
      blockedTopics?: string[];
      discountCapPercent?: number;
      cartAbandonHours?: number;
      cartRecoveryMaxPerWeek?: number;
      restrictedMutations?: Partial<EmployeeGuardrails['restrictedMutations']>;
      escalationRules?: Partial<EmployeeGuardrails['escalationRules']>;
    },
  ): Promise<Employee> {
    return this.updateGuardrailsByRole(tenantId, 'sales', body);
  }

  async updateGuardrailsByRole(
    tenantId: string,
    role: EmployeeRole,
    body: {
      blockedTopics?: string[];
      discountCapPercent?: number;
      cartAbandonHours?: number;
      cartRecoveryMaxPerWeek?: number;
      restrictedMutations?: Partial<EmployeeGuardrails['restrictedMutations']>;
      escalationRules?: Partial<EmployeeGuardrails['escalationRules']>;
    },
  ): Promise<Employee> {
    const current = await this.getByRole(tenantId, role);
    const merged = normalizeGuardrails({
      ...current.guardrails,
      ...body,
      restrictedMutations: {
        ...current.guardrails.restrictedMutations,
        ...(body.restrictedMutations ?? {}),
      },
      escalationRules: {
        ...current.guardrails.escalationRules,
        ...(body.escalationRules ?? {}),
      },
    });
    merged.restrictedMutations.refund = true;
    merged.restrictedMutations.cancel = true;

    const employee = await this.store.updateEmployeeGuardrails(
      tenantId,
      merged,
      role,
    );
    if (!employee) throw new NotFoundException('Employee not found');
    employeeEvents.emit('employee.updated', {
      tenantId,
      employeeId: employee.id,
      role,
    });
    return employee;
  }
}
