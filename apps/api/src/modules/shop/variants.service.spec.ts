import { describe, expect, it, vi } from 'vitest';
import { VariantsService } from './variants.service';
import { buildOptionsKey } from './domain';

type CreatedVariant = { optionsKey: string; sku: string; valueIds: string[] };

/**
 * Fakes only what generate() touches. Attribute values are tenant-scoped so a
 * cross-tenant value id fails the same way it would against the database.
 */
function fakeDeps(options: {
  existingKeys?: string[];
  values?: Array<{ id: string; attributeId: string; value: string }>;
  /** Tenant the attribute values belong to; defaults to the calling tenant. */
  valueTenantId?: string;
}) {
  const valueTenantId = options.valueTenantId ?? 't1';
  const values = options.values ?? [];
  const existingKeys = options.existingKeys ?? [];
  const created: CreatedVariant[] = [];

  const visibleValues = (where: { tenantId: string; id: { in: string[] } }) =>
    where.tenantId === valueTenantId
      ? values.filter((v) => where.id.in.includes(v.id))
      : [];

  const prisma = {
    product: {
      findFirst: vi.fn(
        async ({
          where,
        }: {
          where: { tenantId: string; sku?: string; id?: string };
        }) => {
          if (where.tenantId !== 't1') return null;
          // SKU-collision probe from uniqueSku — only TSHIRT itself is taken.
          if (where.sku !== undefined) {
            return where.sku === 'TSHIRT' ? { id: 'p1' } : null;
          }
          return {
            id: 'p1',
            sku: 'TSHIRT',
            source: 'native',
            price: 100,
            currency: 'IRR',
          };
        },
      ),
      findUniqueOrThrow: vi.fn(async () => ({ price: 100, currency: 'IRR' })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    productVariant: {
      findMany: vi.fn(async (args: { select?: unknown }) => {
        const keys = [
          ...existingKeys,
          ...created.map((c) => c.optionsKey),
        ];
        // generate() selects only the keys; listForProduct() needs full rows.
        if (args.select) {
          return keys.map((optionsKey, i) => ({ id: `v${i}`, optionsKey }));
        }
        return keys.map((optionsKey, i) => ({
          id: `v${i}`,
          productId: 'p1',
          sku: `TSHIRT-${i}`,
          barcode: null,
          optionsKey,
          price: null,
          compareAtPrice: null,
          costPrice: null,
          weightGrams: null,
          imageUrl: null,
          active: true,
          sortOrder: i,
          attributeValues: [],
          inventoryLevel: null,
        }));
      }),
      findFirst: vi.fn(async () => null),
      count: vi.fn(async () => existingKeys.length + created.length),
      create: vi.fn(
        async ({
          data,
        }: {
          data: {
            sku: string;
            optionsKey: string;
            attributeValues: { create: Array<{ attributeValueId: string }> };
          };
        }) => {
          created.push({
            optionsKey: data.optionsKey,
            sku: data.sku,
            valueIds: data.attributeValues.create.map(
              (c) => c.attributeValueId,
            ),
          });
          return { id: `new-${created.length}`, ...data };
        },
      ),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    attributeValue: {
      count: vi.fn(
        async ({ where }: { where: { tenantId: string; id: { in: string[] } } }) =>
          visibleValues(where).length,
      ),
      findMany: vi.fn(
        async ({
          where,
          select,
        }: {
          where: { tenantId: string; id: { in: string[] } };
          select: Record<string, boolean>;
        }) =>
          visibleValues(where).map((v) =>
            select.attributeId
              ? { id: v.id, attributeId: v.attributeId }
              : { id: v.id, value: v.value, label: null },
          ),
      ),
    },
  };

  const inventory = {
    ensureLevel: vi.fn(async () => ({ id: 'lvl' })),
    refreshProductProjection: vi.fn(async () => undefined),
    dropProductLevel: vi.fn(async () => undefined),
    adjust: vi.fn(async () => undefined),
    setThreshold: vi.fn(async () => undefined),
  };

  const service = new VariantsService(
    prisma as unknown as ConstructorParameters<typeof VariantsService>[0],
    inventory as unknown as ConstructorParameters<typeof VariantsService>[1],
  );

  return { service, created, inventory, prisma };
}

const colorSize = [
  { id: 'black', attributeId: 'color', value: 'مشکی' },
  { id: 'white', attributeId: 'color', value: 'سفید' },
  { id: 'm', attributeId: 'size', value: 'M' },
  { id: 'l', attributeId: 'size', value: 'L' },
];

const selections = [
  { attributeId: 'color', valueIds: ['black', 'white'] },
  { attributeId: 'size', valueIds: ['m', 'l'] },
];

describe('VariantsService.generate', () => {
  it('creates the full cartesian product on first run', async () => {
    const { service, created } = fakeDeps({ values: colorSize });
    const result = await service.generate('t1', 'p1', selections);

    expect(result.created).toBe(4);
    expect(created).toHaveLength(4);
    expect(new Set(created.map((c) => c.optionsKey)).size).toBe(4);
  });

  it('only creates combinations that are missing', async () => {
    const { service, created } = fakeDeps({
      values: colorSize,
      existingKeys: [
        buildOptionsKey(['black', 'm']),
        buildOptionsKey(['white', 'l']),
      ],
    });
    const result = await service.generate('t1', 'p1', selections);

    expect(result.created).toBe(2);
    expect(result.unchanged).toBe(2);
    expect(created.map((c) => c.optionsKey).sort()).toEqual(
      [buildOptionsKey(['black', 'l']), buildOptionsKey(['white', 'm'])].sort(),
    );
  });

  it('is idempotent when nothing changed', async () => {
    const allKeys = [
      buildOptionsKey(['black', 'm']),
      buildOptionsKey(['black', 'l']),
      buildOptionsKey(['white', 'm']),
      buildOptionsKey(['white', 'l']),
    ];
    const { service, created } = fakeDeps({
      values: colorSize,
      existingKeys: allKeys,
    });
    const result = await service.generate('t1', 'p1', selections);

    expect(result.created).toBe(0);
    expect(created).toHaveLength(0);
  });

  it('gives each generated variant its own inventory level', async () => {
    const { service, inventory } = fakeDeps({ values: colorSize });
    await service.generate('t1', 'p1', selections);
    expect(inventory.ensureLevel).toHaveBeenCalledTimes(4);
    // Variants own the stock, so the product-level row must go away.
    expect(inventory.dropProductLevel).toHaveBeenCalled();
  });

  it('rejects attribute values belonging to another tenant', async () => {
    const { service, created } = fakeDeps({
      values: colorSize,
      valueTenantId: 'other',
    });
    await expect(service.generate('t1', 'p1', selections)).rejects.toThrow(
      'برخی مقادیر ویژگی معتبر نیستند',
    );
    expect(created).toHaveLength(0);
  });

  it('refuses to generate variants for another tenant\u2019s product', async () => {
    const { service } = fakeDeps({ values: colorSize });
    await expect(
      service.generate('other-tenant', 'p1', selections),
    ).rejects.toThrow('محصول پیدا نشد');
  });

  it('refuses combinations above the generation limit', async () => {
    const wide = Array.from({ length: 4 }, (_, a) => ({
      attributeId: `a${a}`,
      valueIds: Array.from({ length: 6 }, (_, v) => `a${a}v${v}`),
    }));
    const values = wide.flatMap((s) =>
      s.valueIds.map((id) => ({ id, attributeId: s.attributeId, value: id })),
    );
    const { service } = fakeDeps({ values });

    await expect(service.generate('t1', 'p1', wide)).rejects.toThrow(
      /از حد مجاز/,
    );
  });
});
