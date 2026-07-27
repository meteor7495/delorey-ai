import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3010,http://localhost:5173')
    .split(',')
    .map((s) => s.trim());

  app.enableCors({ origin: origins, credentials: true });
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
