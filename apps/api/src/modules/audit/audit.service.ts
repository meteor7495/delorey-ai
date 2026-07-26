import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import type { AuthContext } from '../platform/auth.guard';

@Injectable()
export class AuditService {
  constructor(private readonly store: DataStore) {}

  list(
    tenantId: string,
    opts: {
      days?: number;
      decision?: string;
      conversationId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.store.listAuditTurns(tenantId, opts);
  }

  async get(tenantId: string, id: string) {
    const turn = await this.store.getAuditTurn(tenantId, id);
    if (!turn) throw new NotFoundException('Audit turn not found');
    return turn;
  }

  listAdmin(
    tenantId: string,
    opts: {
      days?: number;
      action?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    return this.store.listAdminAudits(tenantId, opts);
  }

  async getAdmin(tenantId: string, id: string) {
    const event = await this.store.getAdminAudit(tenantId, id);
    if (!event) throw new NotFoundException('Admin audit not found');
    return event;
  }

  recordAdmin(
    auth: AuthContext,
    action: string,
    summary: string,
    payload?: Record<string, unknown> | null,
  ) {
    return this.store.addAdminAudit({
      tenantId: auth.tenantId,
      actorUserId: auth.userId,
      action,
      summary,
      payload: payload ?? null,
    });
  }
}
