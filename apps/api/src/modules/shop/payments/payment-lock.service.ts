import { randomBytes } from 'crypto';
import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { paymentLockKey } from '../domain/payment';

const LOCK_TTL_MS = 15_000;
const LOCK_WAIT_MS = 8_000;
const LOCK_POLL_MS = 50;
const RELEASE_LUA = `
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
`;

/**
 * Serializes payment start/verify per order.
 * Redis SET NX when available; in-memory mutex otherwise (local DX / tests).
 */
@Injectable()
export class PaymentLockService implements OnModuleDestroy {
  private readonly log = new Logger(PaymentLockService.name);
  private redis: Redis | null = null;
  private readonly memory = new Map<string, Promise<void>>();

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL')?.trim();
    if (!url) return;
    try {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
      });
      void this.redis.connect().catch((err) => {
        this.log.warn(
          `Payment lock Redis unavailable: ${err instanceof Error ? err.message : err}`,
        );
        void this.redis?.quit().catch(() => undefined);
        this.redis = null;
      });
    } catch (err) {
      this.log.warn(
        `Payment lock Redis init failed: ${err instanceof Error ? err.message : err}`,
      );
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
      this.redis = null;
    }
  }

  async withOrderLock<T>(
    tenantId: string,
    orderId: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const key = paymentLockKey(tenantId, orderId);
    if (this.redis) {
      return this.withRedisLock(key, fn);
    }
    return this.withMemoryLock(key, fn);
  }

  private async withRedisLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const token = randomBytes(16).toString('hex');
    const deadline = Date.now() + LOCK_WAIT_MS;
    let acquired = false;
    while (Date.now() < deadline) {
      try {
        const ok = await this.redis!.set(key, token, 'PX', LOCK_TTL_MS, 'NX');
        if (ok === 'OK') {
          acquired = true;
          break;
        }
      } catch (err) {
        this.log.warn(
          `Payment lock Redis error, falling back to memory: ${err instanceof Error ? err.message : err}`,
        );
        return this.withMemoryLock(key, fn);
      }
      await sleep(LOCK_POLL_MS);
    }
    if (!acquired) {
      throw new ConflictException('پرداخت در حال پردازش است');
    }
    try {
      return await fn();
    } finally {
      try {
        await this.redis!.eval(RELEASE_LUA, 1, key, token);
      } catch {
        /* TTL will expire */
      }
    }
  }

  private async withMemoryLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.memory.get(key) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const tail = prev.then(() => current);
    this.memory.set(key, tail);
    await prev;
    try {
      return await fn();
    } finally {
      release();
      if (this.memory.get(key) === tail) {
        this.memory.delete(key);
      }
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
