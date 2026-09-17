import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'path';
import configuration from './configuration';
import { envValidationSchema } from './env.validation';

/** Backend package root — works from src/ (dev) and dist/ (prod). */
const backendRoot = join(__dirname, '..', '..');

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env.local'),
        join(process.cwd(), '.env'),
        // Prefer package-local .env when cwd is the monorepo root (Docker).
        join(backendRoot, '.env.local'),
        join(backendRoot, '.env'),
      ],
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
  ],
})
export class AppConfigModule {}
