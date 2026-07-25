import { Injectable, NotFoundException } from '@nestjs/common';
import { MemoryStore } from '../platform/memory.store';
import type { Employee } from '../platform/types';

@Injectable()
export class EmployeeService {
  constructor(private readonly store: MemoryStore) {}

  get(tenantId: string): Employee {
    const employee = this.store.employeeForTenant(tenantId);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  update(
    tenantId: string,
    patch: Partial<
      Pick<Employee, 'name' | 'tone' | 'language' | 'status'> & {
        skills?: Partial<Employee['skills']>;
      }
    >,
  ): Employee {
    const employee = this.get(tenantId);
    if (patch.name) employee.name = patch.name;
    if (patch.tone) employee.tone = patch.tone;
    if (patch.language) employee.language = patch.language;
    if (patch.status) employee.status = patch.status;
    if (patch.skills) employee.skills = { ...employee.skills, ...patch.skills };
    this.store.employees.set(employee.id, employee);
    return employee;
  }
}
