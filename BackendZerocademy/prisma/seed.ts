import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { runCatalogSeeds } from './seeds';
import { seedGradesDemo } from './seeds/grades-demo.seed';
import { seedError, seedLog } from './seeds/seed-logger';

const prisma = new PrismaClient();

async function seedAdminUser(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@zerocademy.edu';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'System',
        lastName: 'Administrator',
        role: Role.SUPER_ADMIN,
        isActive: true,
      },
    });

    seedLog({
      event: 'ADMIN_USER_INSERTED',
      message: 'Seeded SUPER_ADMIN user',
      metadata: { email },
    });
  } else {
    seedLog({
      event: 'ADMIN_USER_SKIPPED',
      message: 'Admin user already exists',
      metadata: { email },
    });
  }
}

async function seedHealthCheck(): Promise<void> {
  if (process.env.SEED_DRY_RUN === 'true') {
    seedLog({
      event: 'HEALTH_CHECK_DRY_RUN',
      message: 'Dry run: would upsert HealthCheck row',
    });
    return;
  }

  await prisma.healthCheck.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: { checkedAt: new Date() },
  });

  seedLog({
    event: 'HEALTH_CHECK_UPSERTED',
    message: 'Seeded HealthCheck probe row',
  });
}

async function main(): Promise<void> {
  const dryRun = process.env.SEED_DRY_RUN === 'true';
  const skipCatalog =
    process.env.SEED_SKIP_CATALOG === 'true' ||
    process.env.SEED_SKIP_CURRICULUM === 'true';

  const skipDemo = process.env.SEED_SKIP_DEMO === 'true';

  seedLog({
    event: 'SEED_RUN_START',
    message: 'Prisma seed started',
    metadata: { dryRun, skipCatalog, skipDemo },
  });

  await seedAdminUser();
  await seedHealthCheck();

  if (!skipCatalog) {
    await runCatalogSeeds(prisma, {
      catalogs: process.env.SEED_CATALOGS,
      dryRun,
    });
  } else {
    seedLog({
      event: 'CATALOG_SEED_DISABLED',
      message: 'Catalog seeds skipped (SEED_SKIP_CATALOG=true)',
    });
  }

  if (!skipDemo) {
    await seedGradesDemo(prisma, { dryRun });
  } else {
    seedLog({
      event: 'DEMO_SEED_DISABLED',
      message: 'Demo institution seed skipped (SEED_SKIP_DEMO=true)',
    });
  }

  seedLog({
    event: 'SEED_RUN_COMPLETE',
    message: 'Prisma seed finished',
  });
}

main()
  .catch((error: unknown) => {
    seedError({
      event: 'SEED_RUN_FAILED',
      message: error instanceof Error ? error.message : 'Seed failed',
    });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
