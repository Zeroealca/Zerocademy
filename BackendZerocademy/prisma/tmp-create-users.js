const { PrismaClient, Role, InstitutionMembershipRole } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { randomBytes } = require('crypto');

const prisma = new PrismaClient();
const institutionId = '1dbce586-4317-48fd-ae63-5e67017129b6';
const saltRounds = Number.parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);

const firstNames = ['Sofía', 'Mateo', 'Valentina', 'Daniel'];
const lastNames = ['Mendoza', 'Vega', 'Cordero', 'Ríos'];
const roles = [Role.ADMIN, Role.ADMIN, Role.TEACHER, Role.TEACHER];

function token(length = 6) {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

function password() {
  return `${randomBytes(12).toString('base64url')}!9a`;
}

async function main() {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
    select: { id: true, name: true },
  });
  if (!institution) throw new Error('Target institution was not found');

  const accounts = roles.map((role, index) => ({
    email: `${role.toLowerCase()}.${token()}@example.com`,
    firstName: firstNames[index],
    lastName: lastNames[index],
    role,
    password: password(),
  }));

  await prisma.$transaction(async (tx) => {
    for (const account of accounts) {
      const user = await tx.user.create({
        data: {
          email: account.email,
          passwordHash: await bcrypt.hash(account.password, saltRounds),
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          isActive: true,
        },
      });
      await tx.institutionMembership.create({
        data: {
          institutionId,
          userId: user.id,
          role: account.role === Role.ADMIN
            ? InstitutionMembershipRole.ADMIN
            : InstitutionMembershipRole.TEACHER,
        },
      });
      if (account.role === Role.TEACHER) {
        await tx.teacherProfile.create({ data: { userId: user.id, institutionId } });
      }
    }
  });

  console.log(JSON.stringify({ institution, createdUsers: accounts.length, accounts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
