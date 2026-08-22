import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';
import type { PricingRuleMatch } from './domain/pricing';
import { pickBestRule } from './domain/pricing';

@Injectable()
export class PricingEngine {
  constructor(private readonly prisma: PrismaService) {}

  async findRule(args: {
    service: string;
    provider: string;
    model: string;
    unitType: string;
    at?: Date;
  }): Promise<PricingRuleMatch | null> {
    const at = args.at ?? new Date();
    const rows = await this.prisma.pricingRule.findMany({
      where: {
        service: args.service,
        unitType: args.unitType,
        status: 'active',
        effectiveFrom: { lte: at },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
        AND: [
          { OR: [{ provider: args.provider }, { provider: '*' }] },
          { OR: [{ model: args.model }, { model: '*' }] },
        ],
      },
    });
    const best = pickBestRule(rows);
    if (!best) return null;
    return {
      unitType: best.unitType,
      unitPrice: Number(best.unitPrice),
      markup: Number(best.markup),
      provider: best.provider,
      model: best.model,
    };
  }

  async listActive() {
    const now = new Date();
    return this.prisma.pricingRule.findMany({
      where: {
        status: 'active',
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: now } }],
      },
      orderBy: [{ service: 'asc' }, { unitType: 'asc' }],
    });
  }

  async upsertRule(input: {
    id?: string;
    service: string;
    provider: string;
    model: string;
    unitType: string;
    unitPrice: number;
    markup: number;
    status?: string;
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
  }) {
    const data = {
      service: input.service,
      provider: input.provider || '*',
      model: input.model || '*',
      unitType: input.unitType,
      unitPrice: new Prisma.Decimal(input.unitPrice),
      markup: new Prisma.Decimal(input.markup),
      status: input.status ?? 'active',
      effectiveFrom: input.effectiveFrom ?? new Date(),
      effectiveTo: input.effectiveTo ?? null,
    };
    if (input.id) {
      return this.prisma.pricingRule.update({ where: { id: input.id }, data });
    }
    return this.prisma.pricingRule.create({ data });
  }
}
