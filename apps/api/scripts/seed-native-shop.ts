import { PrismaClient } from '@prisma/client';
import { seedNativeShop } from '../src/modules/platform/demo-catalog';

async function main() {
  const prisma = new PrismaClient();
  const user =
    (await prisma.user.findUnique({
      where: { email: 'demo@seloma.local' },
    })) ??
    (await prisma.user.findUnique({
      where: { email: 'demo@delorey.local' },
    }));
  if (!user) throw new Error('demo user missing');
  const membership = await prisma.workspaceMembership.findFirst({
    where: { userId: user.id },
  });
  if (!membership) throw new Error('demo membership missing');
  await seedNativeShop(prisma, membership.tenantId);
  const tenantId = membership.tenantId;
  const [products, articles, banners, categories, settings] = await Promise.all(
    [
      prisma.product.count({ where: { tenantId } }),
      prisma.article.count({ where: { tenantId } }),
      prisma.storefrontBanner.count({ where: { tenantId } }),
      prisma.category.count({ where: { tenantId } }),
      prisma.storefrontSettings.findUnique({ where: { tenantId } }),
    ],
  );
  console.log(
    JSON.stringify(
      {
        products,
        articles,
        banners,
        categories,
        storeSlug: settings?.storeSlug ?? null,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
