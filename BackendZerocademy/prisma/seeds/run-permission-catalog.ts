import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedPermissionCatalog } from './permission-catalog.seed';
import { seedPermissionProfiles } from './permission-profiles.seed';

const prisma = new PrismaClient();

async function run(): Promise<void> {
  await seedPermissionCatalog(prisma);
  await seedPermissionProfiles(prisma);
}

run()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
