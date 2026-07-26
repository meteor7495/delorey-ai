import { Injectable, NotFoundException } from '@nestjs/common';
import { DataStore } from '../platform/data.store';
import { HandoffService } from './handoff.service';
import type { Conversation, EscalationReason } from '../platform/types';

@Injectable()
export class InboxService {
  constructor(
    private readonly store: DataStore,
    private readonly handoff: HandoffService,
  ) {}

  list(tenantId: string, ownership?: Conversation['ownership']) {
    return this.store.listConversations(
      tenantId,
      ownership ? { ownership } : undefined,
    );
  }

  async getThread(tenantId: string, conversationId: string) {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversation not found');
    }
    const messages = await this.store.listMessages(tenantId, conversationId);
    return { conversation, messages };
  }

  escalate(
    tenantId: string,
    conversationId: string,
    reason: EscalationReason,
  ) {
    return this.handoff.escalate(tenantId, conversationId, reason);
  }

  takeover(tenantId: string, conversationId: string) {
    return this.handoff.takeover(tenantId, conversationId);
  }

  release(tenantId: string, conversationId: string) {
    return this.handoff.release(tenantId, conversationId);
  }

  reply(tenantId: string, conversationId: string, text: string) {
    return this.handoff.operatorReply(tenantId, conversationId, text);
  }
}
