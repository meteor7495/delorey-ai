import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { MemoryStore } from '../platform/memory.store';
import type { Conversation, Message } from '../platform/types';

@Injectable()
export class ConversationService {
  constructor(private readonly store: MemoryStore) {}

  createWebsiteConversation(tenantId: string): Conversation {
    const conversation: Conversation = {
      id: uuid(),
      tenantId,
      channel: 'website',
      ownership: 'ai_owned',
      createdAt: new Date().toISOString(),
    };
    this.store.conversations.set(conversation.id, conversation);
    return conversation;
  }

  get(conversationId: string): Conversation | undefined {
    return this.store.conversations.get(conversationId);
  }

  addMessage(
    partial: Omit<Message, 'id' | 'createdAt'> & { citations?: Message['citations'] },
  ): Message {
    const message: Message = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      ...partial,
    };
    this.store.messages.push(message);
    return message;
  }

  listMessages(tenantId: string, conversationId: string): Message[] {
    return this.store.messages.filter(
      (m) => m.tenantId === tenantId && m.conversationId === conversationId,
    );
  }
}
