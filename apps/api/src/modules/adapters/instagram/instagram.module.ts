import { Module, forwardRef } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { PlatformModule } from '../../platform/platform.module';
import { RuntimeModule } from '../../runtime/runtime.module';
import { InstagramAdapterController } from './instagram.controller';
import { InstagramAdapterService } from './instagram.service';
import { InstagramSpikeController } from './instagram-spike.controller';
import { InstagramSpikeService } from './instagram-spike.service';

@Module({
  imports: [PlatformModule, AuditModule, forwardRef(() => RuntimeModule)],
  controllers: [InstagramSpikeController, InstagramAdapterController],
  providers: [InstagramSpikeService, InstagramAdapterService],
  exports: [InstagramSpikeService, InstagramAdapterService],
})
export class InstagramSpikeModule {}
