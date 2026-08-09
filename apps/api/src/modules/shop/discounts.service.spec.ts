import { describe, expect, it, vi } from 'vitest';
import { DiscountsService } from './discounts.service';

type Row = Record<string, unknown>;

function discountRow(overrides: Row = {}): Row {
  return {
    id: 'd1',
    tenantId: 't1',
    name: 'جشنواره',
    code: null,
    type: 'percentage',
    value: 10,
    currency: 'IRR',
    startsAt: null,
    endsAt: null,
    active: true,
    usageLimit: null,
    perCustomerLimit: null,
    usedCount: 0,
    minCartAmount: null,
    maxDiscountAmount: null,
    priority: 0,
    stackable: false,
    targets: [{ id: 'tg1', targetType: 'all', targetId: null }],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function fakeService(options: { discounts?: Row[]; products?: Row[] } = {}) {
  const discounts = options.discounts ?? [];
  const products = options.products ?? [
    {
      id: 'p1',
      tenantId: 't1',
      price: 500_000,
      currency: 'IRR',
      categoryId: 'c1',
    },
  ];

  const prisma = {
    discount: {
      findMany: vi.fn(async ({ where }: { where: Row }) =>
        discounts.filter(
          (d) =>
            d.tenantId === where.tenantId &&
            (where.active === undefined || d.active === where.active),
        ),
      ),
      findFirst: vi.fn(async ({ where }: { where: Row }) =>
        discounts.find(
          (d) => d.tenantId === where.tenantId && d.code === where.code,
        ) ?? null,
      ),
    },
    product: {
      findFirst: vi.fn(async ({ where }: { where: Row }) =>
        products.find(
          (p) => p.tenantId === where.tenantId && p.id === where.id,
        ) ?? null,
      ),
    },
    productVariant: { findFirst: vi.fn(async () => null) },
  };

  return new DiscountsService(
    prisma as unknown as ConstructorParameters<typeof DiscountsService>[0],
  );
}

describe('DiscountsService.quote', () => {
  it('prices a line from the product, not from the caller', async () => {
    const service = fakeService({ discounts: [discountRow()] });
    const quote = await service.quote('t1', { productId: 'p1', quantity: 2 });

    expect(quote.unitPrice).toBe(500_000);
    expect(quote.subtotal).toBe(1_000_000);
    expect(quote.discountAmount).toBe(100_000);
    expect(quote.finalPrice).toBe(900_000);
  });

  it('honours the maximum discount cap', async () => {
    const service = fakeService({
      discounts: [discountRow({ value: 50, maxDiscountAmount: 100_000 })],
    });
    const quote = await service.quote('t1', { productId: 'p1' });

    expect(quote.discountAmount).toBe(100_000);
    expect(quote.finalPrice).toBe(400_000);
  });

  it('skips a discount when the cart is below its minimum', async () => {
    const service = fakeService({
      discounts: [discountRow({ minCartAmount: 900_000 })],
    });
    const quote = await service.quote('t1', { productId: 'p1' });

    expect(quote.discountAmount).toBe(0);
    expect(quote.appliedDiscounts).toEqual([]);
  });

  it('applies only the top-priority discount when it is not stackable', async () => {
    const service = fakeService({
      discounts: [
        discountRow({ id: 'a', value: 10, priority: 1 }),
        discountRow({ id: 'b', value: 20, priority: 5 }),
      ],
    });
    const quote = await service.quote('t1', { productId: 'p1' });

    expect(quote.appliedDiscounts).toHaveLength(1);
    expect(quote.appliedDiscounts[0]?.id).toBe('b');
    expect(quote.finalPrice).toBe(400_000);
  });

  it('ignores discounts that target a different product', async () => {
    const service = fakeService({
      discounts: [
        discountRow({
          targets: [{ id: 'tg', targetType: 'product', targetId: 'other' }],
        }),
      ],
    });
    const quote = await service.quote('t1', { productId: 'p1' });
    expect(quote.discountAmount).toBe(0);
  });

  it('applies a discount that targets the product\u2019s category', async () => {
    const service = fakeService({
      discounts: [
        discountRow({
          targets: [{ id: 'tg', targetType: 'category', targetId: 'c1' }],
        }),
      ],
    });
    const quote = await service.quote('t1', { productId: 'p1' });
    expect(quote.discountAmount).toBe(50_000);
  });
});

describe('DiscountsService.validateCode', () => {
  it('accepts a live code', async () => {
    const service = fakeService({
      discounts: [discountRow({ code: 'NOWRUZ' })],
    });
    const result = await service.validateCode('t1', 'NOWRUZ', 500_000);

    expect(result.valid).toBe(true);
    expect(result.discount?.code).toBe('NOWRUZ');
  });

  it('rejects an unknown code without throwing', async () => {
    const service = fakeService({ discounts: [] });
    const result = await service.validateCode('t1', 'GHOST');

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not_found');
  });

  it('rejects a code whose usage limit is exhausted', async () => {
    const service = fakeService({
      discounts: [discountRow({ code: 'GONE', usageLimit: 5, usedCount: 5 })],
    });
    const result = await service.validateCode('t1', 'GONE', 500_000);

    expect(result.valid).toBe(false);
    expect(result.reason).toBe('not_applicable');
  });

  it('rejects an expired code', async () => {
    const service = fakeService({
      discounts: [
        discountRow({ code: 'OLD', endsAt: new Date('2020-01-01') }),
      ],
    });
    const result = await service.validateCode('t1', 'OLD', 500_000);
    expect(result.valid).toBe(false);
  });
});
