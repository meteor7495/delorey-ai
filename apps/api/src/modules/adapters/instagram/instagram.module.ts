import { Module } from '@nestjs/common';
import { PlatformModule } from '../../platform/platform.module';
import { InstagramSpikeController } from './instagram-spike.controller';
import { InstagramSpikeService } from './instagram-spike.service';

/**
 * Growth evaluation spike for BoxAPI Instagram Official API.
 * Enabled only when BOXAPI_SPIKE_ENABLED=1. Not part of MVP channels.
 */
@Module({
  imports: [PlatformModule],
  controllers: [InstagramSpikeController],
  providers: [InstagramSpikeService],
  exports: [InstagramSpikeService],
})
export class InstagramSpikeModule {}
