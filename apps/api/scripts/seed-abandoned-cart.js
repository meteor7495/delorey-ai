const { PrismaClient } = require('@prisma/client');
const { v4: uuid } = require('uuid');

const tenantId = process.argv[2];
const productId = process.argv[3];
const price = Number(process.argv[4] || 0);

async function main() {
  const p = new PrismaClient();
  const cartId = uuid();
  const old = new Date(Date.now() - 5 * 60 * 60 * 1000);
  await p.cart.create({
    data: {
      id: cartId,
      tenantId,
      sessionId: `test-abandon-${Date.now()}`,
      channel: 'website',
      status: 'abandoned',
      createdAt: old,
      updatedAt: old,
      items: {
        create: [
          {
            id: uuid(),
            productId,
            quantity: 1,
            unitPriceSnapshot: price,
            lineTotalSnapshot: price,
          },
        ],
      },
    },
  });
  console.log(cartId);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
