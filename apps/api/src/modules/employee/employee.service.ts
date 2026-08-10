import { EventEmitter } from 'node:events';
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import type { Employee, EmployeeGuardrails } from '../platform/types';
import { normalizeGuardrails } from '../platform/types';

/** In-process bus for `employee.updated` (Runtime loads config each turn). */
export const employeeEvents = new EventEmitter();

@Injectable()
export class EmployeeService {
  constructor(private readonly store: DataStore) {}

  async get(tenantId: string): Promise<Employee> {
    await this.store.provisionTenantDefaults(tenantId);
    const employee = await this.store.employeeForTenant(tenantId);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async update(
    tenantId: string,
    patch: Partial<
      Pick<Employee, 'name' | 'tone' | 'language' | 'status'> & {
        skills?: Partial<Employee['skills']>;
      }
    >,
  ): Promise<Employee> {
    await this.store.provisionTenantDefaults(tenantId);
    const employee = await this.store.updateEmployee(tenantId, patch);
    if (!employee) throw new NotFoundException('Employee not found');
    employeeEvents.emit('employee.updated', {
      tenantId,
      employeeId: employee.id,
    });
    return employee;
  }

  async updateGuardrails(
    tenantId: string,
    body: {
      blockedTopics?: string[];
      discountCapPercent?: number;
      restrictedMutations?: Partial<EmployeeGuardrails['restrictedMutations']>;
      escalationRules?: Partial<EmployeeGuardrails['escalationRules']>;
    },
  ): Promise<Employee> {
    const current = await this.get(tenantId);
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
    // MVP: refund/cancel always restricted — cannot disable for vanity automation
    merged.restrictedMutations.refund = true;
    merged.restrictedMutations.cancel = true;

    const employee = await this.store.updateEmployeeGuardrails(
      tenantId,
      merged,
    );
    if (!employee) throw new NotFoundException('Employee not found');
    employeeEvents.emit('employee.updated', {
      tenantId,
      employeeId: employee.id,
    });
    return employee;
  }
}
