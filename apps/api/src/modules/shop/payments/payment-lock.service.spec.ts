import { describe, expect, it } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { PaymentLockService } from './payment-lock.service';

function memoryLock() {
  return new PaymentLockService({
    get: () => undefined,
  } as unknown as ConfigService);
}

describe('PaymentLockService', () => {
  it('serializes work for the same order', async () => {
    const lock = memoryLock();
    const order: number[] = [];
    await Promise.all([
      lock.withOrderLock('t1', 'o1', async () => {
        order.push(1);
        await new Promise((r) => setTimeout(r, 20));
        order.push(2);
      }),
      lock.withOrderLock('t1', 'o1', async () => {
        order.push(3);
      }),
    ]);
    expect(order).toEqual([1, 2, 3]);
  });

  it('does not serialize different orders', async () => {
    const lock = memoryLock();
    let concurrent = 0;
    let max = 0;
    const hold = async () => {
      concurrent += 1;
      max = Math.max(max, concurrent);
      await new Promise((r) => setTimeout(r, 20));
      concurrent -= 1;
    };
    await Promise.all([
      lock.withOrderLock('t1', 'a', hold),
      lock.withOrderLock('t1', 'b', hold),
    ]);
    expect(max).toBe(2);
  });
});
