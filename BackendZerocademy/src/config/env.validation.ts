import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string().uri().required(),
  // Prisma directUrl (Neon non-pooler). Defaults to DATABASE_URL for local/Docker.
  DATABASE_URL_UNPOOLED: Joi.string().uri().default(Joi.ref('DATABASE_URL')),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_SALT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
  CORS_ORIGIN: Joi.string().default('http://localhost:3000'),
  SWAGGER_ENABLED: Joi.string().valid('true', 'false', '').optional(),
  PRISMA_LOG_QUERIES: Joi.string().valid('true', 'false', '').optional(),
  UPLOADS_DIR: Joi.string().default('uploads'),
});
