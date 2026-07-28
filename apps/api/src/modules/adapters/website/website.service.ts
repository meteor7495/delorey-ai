import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataStore } from '../../platform/data.store';
import { ConversationService } from '../../conversation/conversation.service';
import { RuntimeService } from '../../runtime/runtime.service';

@Injectable()
export class WebsiteAdapterService {
  constructor(
    private readonly store: DataStore,
    private readonly conversations: ConversationService,
    private readonly runtime: RuntimeService,
  ) {}

  async createSession(publicKey: string, origin?: string) {
    const channel = await this.store.channelByPublicKey(publicKey);
    if (!channel || channel.channel !== 'website') {
      throw new NotFoundException('Unknown public key');
    }
    this.assertOrigin(channel.allowedOrigins, origin);
    const conversation = await this.conversations.createWebsiteConversation(
      channel.tenantId,
    );
    const employee = await this.store.employeeForTenant(channel.tenantId);
    return {
      conversationId: conversation.id,
      employee: employee?.name ?? 'کارمند فروش',
      status: employee?.status ?? 'inactive',
    };
  }

  async sendMessage(
    publicKey: string,
    conversationId: string,
    text: string,
    origin?: string,
  ) {
    const channel = await this.store.channelByPublicKey(publicKey);
    if (!channel) throw new NotFoundException('Unknown public key');
    this.assertOrigin(channel.allowedOrigins, origin);

    const conversation = await this.conversations.get(conversationId);
    if (!conversation || conversation.tenantId !== channel.tenantId) {
      throw new ForbiddenException('Conversation tenant mismatch');
    }

    await this.conversations.addMessage({
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

    if (turn.decision.startsWith('escalated:')) {
      const messages = await this.conversations.listMessages(
        channel.tenantId,
        conversationId,
      );
      const last = messages[messages.length - 1]!;
      return {
        message: last,
        decision: turn.decision,
        aiState: 'awaiting_human',
        ownership: 'human_owned' as const,
      };
    }

    const reply = await this.conversations.addMessage({
      conversationId,
      tenantId: channel.tenantId,
      role: turn.decision === 'paused_human_owned' ? 'system' : 'employee',
      content: turn.reply,
      citations: turn.citations,
    });

    const employee = await this.store.employeeForTenant(channel.tenantId);
    const ownership =
      turn.ownership ??
      (await this.store.getConversation(conversationId))?.ownership ??
      'ai_owned';

    return {
      message: reply,
      decision: turn.decision,
      aiState:
        ownership === 'human_owned'
          ? 'awaiting_human'
          : (employee?.status ?? 'active'),
      ownership,
    };
  }

  private assertOrigin(allowed: string[], origin?: string) {
    if (!origin) return;
    if (allowed.includes(origin)) return;
    // Local snippet testing (file:// → Origin "null", arbitrary localhost ports)
    if (process.env.NODE_ENV !== 'production') {
      if (origin === 'null') return;
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return;
    }
    throw new ForbiddenException(`Origin not allowed: ${origin}`);
  }
}
