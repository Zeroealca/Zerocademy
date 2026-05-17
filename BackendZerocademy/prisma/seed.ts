import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@zerocademy.edu';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Seed skipped — admin user already exists (${email})`);
    return;
  }

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

  console.log(`Seeded SUPER_ADMIN user: ${email}`);
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
