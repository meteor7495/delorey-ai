import { Injectable } from '@nestjs/common';
import { DataStore } from '../platform/data.store';

@Injectable()
export class AnalyticsService {
  constructor(private readonly store: DataStore) {}

  summary(tenantId: string, days = 7) {
    return this.store.analyticsSummary(tenantId, days);
  }

  knowledgeGaps(tenantId: string, days = 7) {
    return this.store.analyticsKnowledgeGaps(tenantId, days);
  }

  revenue(tenantId: string, days = 7) {
    return this.store.analyticsRevenue(tenantId, days);
  }
}
