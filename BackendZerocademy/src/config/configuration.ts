export interface AppConfig {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  prismaLogQueries: boolean;
  jwt: {
    secret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };
  bcryptSaltRounds: number;
  corsOrigin: string;
}

export default (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const prismaLogQueriesExplicit = process.env.PRISMA_LOG_QUERIES === 'true';
  const prismaLogQueriesDisabled = process.env.PRISMA_LOG_QUERIES === 'false';

  return {
    nodeEnv,
    port: parseInt(process.env.PORT ?? '3001', 10),
    databaseUrl: process.env.DATABASE_URL ?? '',
    prismaLogQueries:
      prismaLogQueriesExplicit ||
      (nodeEnv === 'development' && !prismaLogQueriesDisabled),
    jwt: {
      secret: process.env.JWT_SECRET ?? '',
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  };
};
