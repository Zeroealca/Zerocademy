import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { runCatalogSeeds } from './index';
import { seedGradesDemo } from './grades-demo.seed';
import { seedError, seedLog } from './seed-logger';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const dryRun = process.env.SEED_DRY_RUN === 'true';
  const skipCatalog = process.env.SEED_SKIP_CATALOG === 'true';

  seedLog({
    event: 'GRADES_DEMO_RUN_START',
    message: 'Grades demo seed runner started',
    metadata: { dryRun, skipCatalog },
  });

  if (!skipCatalog) {
    await runCatalogSeeds(prisma, { dryRun });
  }

  await seedGradesDemo(prisma, { dryRun });

  seedLog({
    event: 'GRADES_DEMO_RUN_COMPLETE',
    message: 'Grades demo seed runner finished',
  });
}

main()
  .catch((error: unknown) => {
    seedError({
      event: 'GRADES_DEMO_RUN_FAILED',
      message: error instanceof Error ? error.message : 'Grades demo seed failed',
    });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
