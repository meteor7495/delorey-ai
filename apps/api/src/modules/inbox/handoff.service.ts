import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import {
  ESCALATION_LABELS,
  type EscalationReason,
  type HandoffPacket,
} from '../platform/types';
import { TelegramAdapterService } from '../adapters/telegram/telegram.service';
import { BaleAdapterService } from '../adapters/bale/bale.service';
import { InstagramAdapterService } from '../adapters/instagram/instagram.service';

@Injectable()
export class HandoffService {
  constructor(
    private readonly store: DataStore,
    @Inject(forwardRef(() => TelegramAdapterService))
    private readonly telegram: TelegramAdapterService,
    @Inject(forwardRef(() => BaleAdapterService))
    private readonly bale: BaleAdapterService,
    @Inject(forwardRef(() => InstagramAdapterService))
    private readonly instagram: InstagramAdapterService,
  ) {}

  async buildPacket(
    tenantId: string,
    conversationId: string,
    reason: EscalationReason,
    citations: HandoffPacket['citations'] = [],
    intentSummary: string | null = null,
  ): Promise<HandoffPacket> {
    const messages = await this.store.listMessages(tenantId, conversationId);
    return {
      reason,
      reasonLabel: ESCALATION_LABELS[reason],
      lastMessages: messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      citations,
      intentSummary,
      createdAt: new Date().toISOString(),
    };
  }

  async escalate(
    tenantId: string,
    conversationId: string,
    reason: EscalationReason,
    citations: HandoffPacket['citations'] = [],
    intentSummary: string | null = null,
  ) {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversation not found');
    }

    const packet = await this.buildPacket(
      tenantId,
      conversationId,
      reason,
      citations,
      intentSummary,
    );

    const updated = await this.store.escalateConversation(
      tenantId,
      conversationId,
      reason,
      packet,
    );

    await this.store.addMessage({
      tenantId,
      conversationId,
      role: 'system',
      content: 'یک همکار انسانی به گفتگو می‌پیوندد.',
    });

    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision: `escalated:${reason}`,
      citations,
    });

    return updated;
  }

  async takeover(tenantId: string, conversationId: string) {
    const conversation = await this.requireTenantConversation(
      tenantId,
      conversationId,
    );
    if (conversation.ownership === 'human_owned') {
      return conversation;
    }
    return this.escalate(tenantId, conversationId, 'operator_manual');
  }

  async release(tenantId: string, conversationId: string) {
    await this.requireTenantConversation(tenantId, conversationId);
    const updated = await this.store.setOwnership(
      tenantId,
      conversationId,
      'ai_owned',
      true,
    );
    await this.store.addMessage({
      tenantId,
      conversationId,
      role: 'system',
      content: 'گفتگو به دستیار هوشمند بازگردانده شد.',
    });
    await this.store.addAudit({
      id: uuid(),
      tenantId,
      conversationId,
      decision: 'released_to_ai',
      citations: [],
    });
    return updated;
  }

  async operatorReply(tenantId: string, conversationId: string, text: string) {
    const conversation = await this.requireTenantConversation(
      tenantId,
      conversationId,
    );
    if (conversation.ownership !== 'human_owned') {
      await this.store.setOwnership(tenantId, conversationId, 'human_owned');
    }
    const message = await this.store.addMessage({
      tenantId,
      conversationId,
      role: 'operator',
      content: text,
    });
    await this.telegram.deliverOperatorReply(tenantId, conversationId, text);
    await this.bale.deliverOperatorReply(tenantId, conversationId, text);
    await this.instagram.deliverOperatorReply(tenantId, conversationId, text);
    return message;
  }

  private async requireTenantConversation(
    tenantId: string,
    conversationId: string,
  ) {
    const conversation = await this.store.getConversation(conversationId);
    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }
}
