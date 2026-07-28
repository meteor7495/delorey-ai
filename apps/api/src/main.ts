import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3010,http://localhost:5173')
    .split(',')
    .map((s) => s.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || origins.includes(origin) || origins.includes('*')) {
        callback(null, true);
        return;
      }
      // Embed snippet testing from file:// or other local ports
      if (process.env.NODE_ENV !== 'production') {
        if (
          origin === 'null' ||
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          callback(null, true);
          return;
        }
      }
      callback(new Error(`CORS blocked: ${origin}`), false);
    },
    credentials: true,
  });
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
