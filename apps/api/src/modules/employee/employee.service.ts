import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import type { Employee } from '../platform/types';

@Injectable()
export class EmployeeService {
  constructor(private readonly store: DataStore) {}

  async get(tenantId: string): Promise<Employee> {
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
    const employee = await this.store.updateEmployee(tenantId, patch);
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }
}
