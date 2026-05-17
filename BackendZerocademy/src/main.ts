import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerEnabled =
    process.env.NODE_ENV !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    setupSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
