import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

function isLocalDevOrigin(origin: string): boolean {
  return (
    origin === 'null' ||
    /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3010,http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // No Origin = same-origin / curl / server — always OK
      if (!origin) {
        callback(null, true);
        return;
      }
      if (origins.includes('*') || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
        callback(null, true);
        return;
      }
      // Merchant storefront embeds (Shopify/Woo) — allow HTTPS; tenant
      // allowlist is enforced in WebsiteAdapterService.assertOrigin.
      if (/^https:\/\//i.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  });
  const staticDir = join(__dirname, '..', 'static');
  mkdirSync(join(staticDir, 'uploads'), { recursive: true });
  if (existsSync(staticDir)) {
    app.useStaticAssets(staticDir, { prefix: '/static/' });
  }

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`DeloRey API listening on http://localhost:${port}/v1`);
}

bootstrap();
