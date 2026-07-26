import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';

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
}
