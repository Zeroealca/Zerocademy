import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedEcuadorCurriculum } from './curriculum/ecuador-curriculum.seed';
import { seedError } from './seed-logger';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const dryRun = process.env.SEED_DRY_RUN === 'true';
  await seedEcuadorCurriculum(prisma, { dryRun });
}

main()
  .catch((error: unknown) => {
    seedError({
      event: 'CURRICULUM_SEED_FAILED',
      message: error instanceof Error ? error.message : 'Curriculum seed failed',
    });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
