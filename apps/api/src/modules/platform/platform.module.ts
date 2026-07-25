import { Module, Global } from '@nestjs/common';
import { MemoryStore } from './memory.store';

@Global()
@Module({
  providers: [MemoryStore],
  exports: [MemoryStore],
})
export class PlatformModule {}
