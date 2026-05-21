import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppConfig } from './config/configuration';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService<AppConfig, true>);
  const uploadsDir = configService.get('uploadsDir', { infer: true });
  app.useStaticAssets(join(process.cwd(), uploadsDir), {
    prefix: '/uploads',
  });
  const corsOrigin = configService.get('corsOrigin', { infer: true });

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix('v1', {
    exclude: ['', 'health'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerEnabled =
    configService.get('nodeEnv', { infer: true }) !== 'production' ||
    process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    setupSwagger(app);
  }

  const port = configService.get('port', { infer: true });
  await app.listen(port);
}

void bootstrap();
