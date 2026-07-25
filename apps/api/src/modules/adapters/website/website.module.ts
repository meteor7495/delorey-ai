import { Module } from '@nestjs/common';
import { WebsiteAdapterController } from './website.controller';
import { WebsiteAdapterService } from './website.service';
import { ConversationModule } from '../../conversation/conversation.module';
import { RuntimeModule } from '../../runtime/runtime.module';

@Module({
  imports: [ConversationModule, RuntimeModule],
  controllers: [WebsiteAdapterController],
  providers: [WebsiteAdapterService],
})
export class WebsiteAdapterModule {}
