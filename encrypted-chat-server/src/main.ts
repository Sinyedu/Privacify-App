import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getCorsOrigins } from './config/cors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: getCorsOrigins(),
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap().catch((err) => {
  console.error('Error starting server:', err);
});
