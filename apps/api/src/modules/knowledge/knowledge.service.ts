import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import type { KnowledgeDoc } from '../platform/types';

@Injectable()
export class KnowledgeService {
  constructor(private readonly store: DataStore) {}

  list(tenantId: string) {
    return this.store.listKnowledgeDocs(tenantId);
  }

  async get(tenantId: string, id: string) {
    const doc = await this.store.getKnowledgeDoc(tenantId, id);
    if (!doc) throw new NotFoundException('Knowledge doc not found');
    return doc;
  }

  indexStatus(tenantId: string) {
    return this.store.knowledgeIndexStatus(tenantId);
  }

  create(
    tenantId: string,
    data: {
      docType: 'faq' | 'policy_override';
      title: string;
      bodyText: string;
      sourceAttribution: string;
    },
  ) {
    return this.store.createKnowledgeDoc({ tenantId, ...data });
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      docType: KnowledgeDoc['docType'];
      title: string;
      bodyText: string;
      sourceAttribution: string;
    }>,
  ) {
    const existing = await this.store.getKnowledgeDoc(tenantId, id);
    if (!existing) throw new NotFoundException('Knowledge doc not found');
    return this.store.updateKnowledgeDoc(tenantId, id, data);
  }

  async remove(tenantId: string, id: string) {
    const existing = await this.store.getKnowledgeDoc(tenantId, id);
    if (!existing) throw new NotFoundException('Knowledge doc not found');
    await this.store.deleteKnowledgeDoc(tenantId, id);
    return { ok: true };
  }

  async reindex(tenantId: string, id: string) {
    const existing = await this.store.getKnowledgeDoc(tenantId, id);
    if (!existing) throw new NotFoundException('Knowledge doc not found');
    return this.store.reindexKnowledgeDoc(tenantId, id);
  }

  search(tenantId: string, query: string) {
    return this.store.searchKnowledge(tenantId, query);
  }
}
