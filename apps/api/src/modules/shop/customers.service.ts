import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../platform/prisma.service';
import { isValidMobile, normalizePhone } from './phone';

export type SalesChannel = 'website' | 'telegram' | 'bale' | 'instagram';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async lookupByPhone(tenantId: string, phone: string) {
    const phoneNormalized = normalizePhone(phone);
    if (!phoneNormalized) return null;
    const row = await this.prisma.customer.findUnique({
      where: {
        tenantId_phoneNormalized: { tenantId, phoneNormalized },
      },
      include: { addresses: { orderBy: { updatedAt: 'desc' } } },
    });
    return row ? this.map(row) : null;
  }

  async lookupByIdentity(
    tenantId: string,
    channel: SalesChannel,
    externalId: string,
  ) {
    const ident = await this.prisma.customerIdentity.findUnique({
      where: {
        tenantId_channel_externalId: { tenantId, channel, externalId },
      },
      include: {
        customer: { include: { addresses: { orderBy: { updatedAt: 'desc' } } } },
      },
    });
    return ident ? this.map(ident.customer) : null;
  }

  async upsertFromCheckout(input: {
    tenantId: string;
    name: string;
    phone: string;
    address: string;
    channel: SalesChannel;
    externalId?: string | null;
  }) {
    const phoneNormalized = normalizePhone(input.phone);
    if (!isValidMobile(phoneNormalized) && phoneNormalized.length < 8) {
      throw new BadRequestException('شماره موبایل نامعتبر است');
    }
    const name = input.name.trim();
    const address = input.address.trim();
    if (name.length < 2) throw new BadRequestException('نام گیرنده الزامی است');
    if (address.length < 5) throw new BadRequestException('آدرس الزامی است');

    const customer = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findUnique({
        where: {
          tenantId_phoneNormalized: {
            tenantId: input.tenantId,
            phoneNormalized,
          },
        },
      });
      const row = existing
        ? await tx.customer.update({
            where: { id: existing.id },
            data: { name },
          })
        : await tx.customer.create({
            data: {
              tenantId: input.tenantId,
              name,
              phoneNormalized,
            },
          });

      const defaultAddr = await tx.customerAddress.findFirst({
        where: { customerId: row.id, isDefault: true },
      });
      if (!defaultAddr) {
        await tx.customerAddress.create({
          data: {
            tenantId: input.tenantId,
            customerId: row.id,
            line: address,
            isDefault: true,
          },
        });
      } else if (defaultAddr.line !== address) {
        await tx.customerAddress.updateMany({
          where: { customerId: row.id },
          data: { isDefault: false },
        });
        await tx.customerAddress.create({
          data: {
            tenantId: input.tenantId,
            customerId: row.id,
            line: address,
            isDefault: true,
          },
        });
      }

      if (input.externalId) {
        await tx.customerIdentity.upsert({
          where: {
            tenantId_channel_externalId: {
              tenantId: input.tenantId,
              channel: input.channel,
              externalId: input.externalId,
            },
          },
          create: {
            tenantId: input.tenantId,
            customerId: row.id,
            channel: input.channel,
            externalId: input.externalId,
          },
          update: { customerId: row.id },
        });
      }

      return tx.customer.findUniqueOrThrow({
        where: { id: row.id },
        include: { addresses: { orderBy: { updatedAt: 'desc' } } },
      });
    });

    return this.map(customer);
  }

  async register(input: {
    tenantId: string;
    name: string;
    phone: string;
    address: string;
    sessionId?: string;
  }) {
    return this.upsertFromCheckout({
      tenantId: input.tenantId,
      name: input.name,
      phone: input.phone,
      address: input.address,
      channel: 'website',
      externalId: input.sessionId ?? null,
    });
  }

  private map(row: {
    id: string;
    name: string;
    phoneNormalized: string;
    addresses: Array<{ id: string; line: string; isDefault: boolean }>;
  }) {
    const defaultAddress =
      row.addresses.find((a) => a.isDefault)?.line ??
      row.addresses[0]?.line ??
      null;
    return {
      id: row.id,
      name: row.name,
      phone: row.phoneNormalized,
      defaultAddress,
      addresses: row.addresses.map((a) => ({
        id: a.id,
        line: a.line,
        isDefault: a.isDefault,
      })),
    };
  }
}
