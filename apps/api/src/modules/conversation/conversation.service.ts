import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { DataStore } from '../platform/data.store';
import type { Conversation, Message } from '../platform/types';

@Injectable()
export class ConversationService {
  constructor(private readonly store: DataStore) {}

  async createWebsiteConversation(tenantId: string): Promise<Conversation> {
    return this.store.createConversation({
      id: uuid(),
      tenantId,
      channel: 'website',
      ownership: 'ai_owned',
    });
  }

  async get(conversationId: string): Promise<Conversation | null> {
    return this.store.getConversation(conversationId);
  }

  async addMessage(
    partial: Omit<Message, 'id' | 'createdAt'> & {
      citations?: Message['citations'];
    },
  ): Promise<Message> {
    return this.store.addMessage(partial);
  }

  async listMessages(
    tenantId: string,
    conversationId: string,
  ): Promise<Message[]> {
    return this.store.listMessages(tenantId, conversationId);
  }
}
