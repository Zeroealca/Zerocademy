import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

    console.log(`Seeded SUPER_ADMIN user: ${email}`);
  } else {
    console.log(`Admin user already exists (${email})`);
  }

  await seedSystemAcademicStructure();
}

async function seedSystemAcademicStructure(): Promise<void> {
  const levels = [
    {
      code: 'INICIAL',
      name: 'Inicial',
      order: 1,
      description: 'Early childhood education (example catalog entry)',
      grades: [
        { code: 'INI-1', name: 'Inicial 1', order: 1 },
        { code: 'INI-2', name: 'Inicial 2', order: 2 },
      ],
    },
    {
      code: 'EGB',
      name: 'Educación General Básica',
      order: 2,
      description: 'General basic education (example catalog entry)',
      grades: [
        { code: 'EGB-8', name: '8vo EGB', order: 8 },
        { code: 'EGB-9', name: '9no EGB', order: 9 },
        { code: 'EGB-10', name: '10mo EGB', order: 10 },
      ],
    },
    {
      code: 'BACH',
      name: 'Bachillerato',
      order: 3,
      description: 'Upper secondary education (example catalog entry)',
      grades: [
        { code: 'BACH-1', name: '1ro Bachillerato', order: 1 },
        { code: 'BACH-2', name: '2do Bachillerato', order: 2 },
        { code: 'BACH-3', name: '3ro Bachillerato', order: 3 },
      ],
    },
  ];

  for (const levelSeed of levels) {
    const existingLevel = await prisma.academicLevel.findFirst({
      where: { code: levelSeed.code, institutionId: null },
    });

    const level = existingLevel
      ? await prisma.academicLevel.update({
          where: { id: existingLevel.id },
          data: {
            name: levelSeed.name,
            order: levelSeed.order,
            description: levelSeed.description,
            isSystem: true,
            isActive: true,
          },
        })
      : await prisma.academicLevel.create({
          data: {
            name: levelSeed.name,
            code: levelSeed.code,
            order: levelSeed.order,
            description: levelSeed.description,
            isSystem: true,
            isActive: true,
            institutionId: null,
          },
        });

    for (const gradeSeed of levelSeed.grades) {
      await prisma.gradeLevel.upsert({
        where: {
          academicLevelId_code: {
            academicLevelId: level.id,
            code: gradeSeed.code,
          },
        },
        create: {
          name: gradeSeed.name,
          code: gradeSeed.code,
          order: gradeSeed.order,
          academicLevelId: level.id,
          isSystem: true,
          isActive: true,
          institutionId: null,
        },
        update: {
          name: gradeSeed.name,
          order: gradeSeed.order,
          isSystem: true,
          isActive: true,
        },
      });
    }
  }

  console.log('Seeded system academic levels and grade levels (catalog)');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
