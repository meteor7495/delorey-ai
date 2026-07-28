import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type CircuitState = 'closed' | 'open' | 'half_open';

/**
 * Per-provider circuit breaker in Redis.
 * Key grammar: global:circuit:{providerId}
 * Falls back to in-memory if Redis is unavailable (local DX).
 */
@Injectable()
export class CircuitBreakerService implements OnModuleDestroy {
  private readonly log = new Logger(CircuitBreakerService.name);
  private redis: Redis | null = null;
  private readonly memory = new Map<
    string,
    { failures: number; openUntil: number }
  >();

  private readonly failureThreshold: number;
  private readonly openMs: number;

  constructor(private readonly config: ConfigService) {
    this.failureThreshold = num(
      this.config.get<string>('AI_GATEWAY_CIRCUIT_FAILURES'),
      3,
    );
    this.openMs = num(
      this.config.get<string>('AI_GATEWAY_CIRCUIT_OPEN_MS'),
      30_000,
    );

    const url = this.config.get<string>('REDIS_URL') ?? 'redis://127.0.0.1:6379';
    try {
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        lazyConnect: true,
      });
      void this.redis.connect().catch((err) => {
        this.log.warn(
          `Redis circuit breaker unavailable: ${err instanceof Error ? err.message : err}`,
        );
        void this.redis?.quit().catch(() => undefined);
        this.redis = null;
      });
    } catch (err) {
      this.log.warn(
        `Redis circuit init failed: ${err instanceof Error ? err.message : err}`,
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

  async isAvailable(providerId: string): Promise<boolean> {
    if (providerId === 'mock') return true;
    const state = await this.getState(providerId);
    return state !== 'open';
  }

  async recordSuccess(providerId: string): Promise<void> {
    if (providerId === 'mock') return;
    const key = this.key(providerId);
    if (this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch {
        /* fall through */
      }
    }
    this.memory.delete(providerId);
  }

  async recordFailure(providerId: string): Promise<void> {
    if (providerId === 'mock') return;
    const key = this.key(providerId);
    if (this.redis) {
      try {
        const failures = await this.redis.hincrby(key, 'failures', 1);
        await this.redis.hset(key, 'updatedAt', Date.now().toString());
        if (failures >= this.failureThreshold) {
          await this.redis.hset(
            key,
            'openUntil',
            (Date.now() + this.openMs).toString(),
          );
          await this.redis.pexpire(key, this.openMs * 2);
          this.log.warn(
            `Circuit OPEN provider=${providerId} failures=${failures}`,
          );
        } else {
          await this.redis.pexpire(key, this.openMs * 2);
        }
        return;
      } catch {
        /* fall through */
      }
    }
    const cur = this.memory.get(providerId) ?? {
      failures: 0,
      openUntil: 0,
    };
    cur.failures += 1;
    if (cur.failures >= this.failureThreshold) {
      cur.openUntil = Date.now() + this.openMs;
      this.log.warn(
        `Circuit OPEN (memory) provider=${providerId} failures=${cur.failures}`,
      );
    }
    this.memory.set(providerId, cur);
  }

  private async getState(providerId: string): Promise<CircuitState> {
    const key = this.key(providerId);
    if (this.redis) {
      try {
        const data = await this.redis.hgetall(key);
        const openUntil = Number(data.openUntil ?? 0);
        if (openUntil > Date.now()) return 'open';
        if (openUntil > 0 && openUntil <= Date.now()) return 'half_open';
        return 'closed';
      } catch {
        /* fall through */
      }
    }
    const cur = this.memory.get(providerId);
    if (!cur) return 'closed';
    if (cur.openUntil > Date.now()) return 'open';
    if (cur.openUntil > 0) return 'half_open';
    return 'closed';
  }

  private key(providerId: string): string {
    return `global:circuit:${providerId}`;
  }
}

function num(raw: string | undefined, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
