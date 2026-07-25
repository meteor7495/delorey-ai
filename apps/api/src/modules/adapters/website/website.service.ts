import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemoryStore } from '../../platform/memory.store';
import { ConversationService } from '../../conversation/conversation.service';
import { RuntimeService } from '../../runtime/runtime.service';

@Injectable()
export class WebsiteAdapterService {
  constructor(
    private readonly store: MemoryStore,
    private readonly conversations: ConversationService,
    private readonly runtime: RuntimeService,
  ) {}

  createSession(publicKey: string, origin?: string) {
    const channel = this.store.channelByPublicKey(publicKey);
    if (!channel || channel.channel !== 'website') {
      throw new NotFoundException('Unknown public key');
    }
    this.assertOrigin(channel.allowedOrigins, origin);
    const conversation = this.conversations.createWebsiteConversation(
      channel.tenantId,
    );
    return {
      conversationId: conversation.id,
      employee: this.store.employeeForTenant(channel.tenantId)?.name ?? 'کارمند فروش',
      status: this.store.employeeForTenant(channel.tenantId)?.status ?? 'inactive',
    };
  }

  async sendMessage(
    publicKey: string,
    conversationId: string,
    text: string,
    origin?: string,
  ) {
    const channel = this.store.channelByPublicKey(publicKey);
    if (!channel) throw new NotFoundException('Unknown public key');
    this.assertOrigin(channel.allowedOrigins, origin);

    const conversation = this.conversations.get(conversationId);
    if (!conversation || conversation.tenantId !== channel.tenantId) {
      throw new ForbiddenException('Conversation tenant mismatch');
    }

    this.conversations.addMessage({
      conversationId,
      tenantId: channel.tenantId,
      role: 'shopper',
      content: text,
    });

    const turn = await this.runtime.executeTurn(
      channel.tenantId,
      conversationId,
      text,
    );

    const reply = this.conversations.addMessage({
      conversationId,
      tenantId: channel.tenantId,
      role: 'employee',
      content: turn.reply,
      citations: turn.citations,
    });

    return {
      message: reply,
      decision: turn.decision,
      aiState: this.store.employeeForTenant(channel.tenantId)?.status ?? 'active',
    };
  }

  private assertOrigin(allowed: string[], origin?: string) {
    if (!origin) return; // local tools / curl
    if (!allowed.includes(origin)) {
      throw new ForbiddenException(`Origin not allowed: ${origin}`);
    }
  }
}
