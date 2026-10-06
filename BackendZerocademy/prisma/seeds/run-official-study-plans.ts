import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { seedOfficialStudyPlans } from './official-study-plans.seed';

const prisma = new PrismaClient();
seedOfficialStudyPlans(prisma).catch((error: unknown) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
