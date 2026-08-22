import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../platform/prisma.service';

const PACKS = [
  { slug: 'irt-500k', amount: 500_000, label: '۵۰۰٬۰۰۰ تومان', sortOrder: 10 },
  { slug: 'irt-1m', amount: 1_000_000, label: '۱٬۰۰۰٬۰۰۰ تومان', sortOrder: 20 },
  { slug: 'irt-2m', amount: 2_000_000, label: '۲٬۰۰۰٬۰۰۰ تومان', sortOrder: 30 },
  { slug: 'irt-5m', amount: 5_000_000, label: '۵٬۰۰۰٬۰۰۰ تومان', sortOrder: 40 },
] as const;

const PLAN_CREDITS: Array<{ plan: string; includedCredit: number }> = [
  { plan: 'trial', includedCredit: 50_000 },
  { plan: 'site-starter', includedCredit: 300_000 },
  { plan: 'site-growth', includedCredit: 700_000 },
  { plan: 'site-pro', includedCredit: 1_500_000 },
  { plan: 'ai-sales', includedCredit: 300_000 },
  { plan: 'ai-business', includedCredit: 700_000 },
  { plan: 'starter', includedCredit: 300_000 },
  { plan: 'professional', includedCredit: 700_000 },
  { plan: 'business', includedCredit: 1_500_000 },
];

/** Default IRT unit prices — editable via Admin, never the runtime source of truth in code after seed. */
const RULES: Array<{
  service: string;
  unitType: string;
  unitPrice: number;
  markup: number;
}> = [
  { service: 'AI_CHAT', unitType: 'input_token', unitPrice: 0.02, markup: 2 },
  { service: 'AI_CHAT', unitType: 'output_token', unitPrice: 0.08, markup: 2 },
  { service: 'CONTENT_GENERATION', unitType: 'input_token', unitPrice: 0.02, markup: 2 },
  { service: 'CONTENT_GENERATION', unitType: 'output_token', unitPrice: 0.08, markup: 2 },
  { service: 'EMBEDDING', unitType: 'input_token', unitPrice: 0.005, markup: 2 },
  { service: 'SEARCH', unitType: 'request', unitPrice: 50, markup: 2 },
  { service: 'IMAGE_GENERATION', unitType: 'image', unitPrice: 15_000, markup: 2 },
  { service: 'VOICE', unitType: 'minute', unitPrice: 8_000, markup: 2 },
  { service: 'OCR', unitType: 'page', unitPrice: 2_000, markup: 2 },
  { service: 'EXTERNAL_API', unitType: 'request', unitPrice: 200, markup: 2 },
];

@Injectable()
export class BillingBootstrap implements OnModuleInit {
  private readonly log = new Logger(BillingBootstrap.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await this.seed();
    } catch (err) {
      this.log.warn(
        `billing seed skipped: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  private async seed() {
    await this.prisma.billingSettings.upsert({
      where: { id: 'global' },
      create: { id: 'global' },
      update: {},
    });

    for (const pack of PACKS) {
      await this.prisma.creditPack.upsert({
        where: { slug: pack.slug },
        create: {
          slug: pack.slug,
          amount: pack.amount,
          label: pack.label,
          sortOrder: pack.sortOrder,
          status: 'active',
        },
        update: {},
      });
    }

    for (const g of PLAN_CREDITS) {
      await this.prisma.subscriptionCreditGrant.upsert({
        where: { plan: g.plan },
        create: {
          plan: g.plan,
          includedCredit: g.includedCredit,
          status: 'active',
        },
        update: {},
      });
    }

    const existingRules = await this.prisma.pricingRule.count();
    if (existingRules === 0) {
      await this.prisma.pricingRule.createMany({
        data: RULES.map((r) => ({
          service: r.service,
          provider: '*',
          model: '*',
          unitType: r.unitType,
          unitPrice: new Prisma.Decimal(r.unitPrice),
          markup: new Prisma.Decimal(r.markup),
          status: 'active',
        })),
      });
      this.log.log(`seeded ${RULES.length} pricing rules`);
    }
  }
}
