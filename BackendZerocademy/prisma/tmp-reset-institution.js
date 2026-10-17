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

  const result = await prisma.$transaction(async (tx) => {
    // Break FKs that would block period/profile cleanup (keep Institution row).
    await tx.institution.update({
      where: { id: institutionId },
      data: { activeAcademicPeriodId: null },
    });
    await tx.user.updateMany({
      where: { selectedAcademicPeriod: { institutionId } },
      data: { selectedAcademicPeriodId: null },
    });

    await tx.attendanceJustification.deleteMany({
      where: { attendanceRecord: { institutionId } },
    });
    await tx.attendanceRecord.deleteMany({ where: { institutionId } });
    await tx.gradeAuditEvent.deleteMany({
      where: { assessment: { institutionId } },
    });
    await tx.grade.deleteMany({ where: { assessment: { institutionId } } });
    await tx.assessmentRosterEntry.deleteMany({
      where: { assessment: { institutionId } },
    });
    await tx.assessment.deleteMany({ where: { institutionId } });
    await tx.classSessionAttendanceRecord.deleteMany({
      where: { enrollment: { student: { institutionId } } },
    });
    await tx.classSessionAttendanceRecord.deleteMany({
      where: { classSession: { teacherAssignment: { institutionId } } },
    });
    await tx.lessonPlan.deleteMany({
      where: { academicUnit: { academicPlan: { teacherAssignment: { institutionId } } } },
    });
    await tx.academicUnit.deleteMany({
      where: { academicPlan: { teacherAssignment: { institutionId } } },
    });
    await tx.academicPlan.deleteMany({
      where: { teacherAssignment: { institutionId } },
    });
    await tx.classSession.deleteMany({
      where: { teacherAssignment: { institutionId } },
    });
    await tx.teacherAssignment.deleteMany({ where: { institutionId } });
    await tx.enrollment.deleteMany({
      where: { OR: [{ student: { institutionId } }, { course: { institutionId } }] },
    });
    await tx.representativeStudent.deleteMany({
      where: { student: { institutionId } },
    });
    await tx.academicPeriodTransition.deleteMany({ where: { institutionId } });
    await tx.subjectGradeLevel.deleteMany({
      where: { OR: [{ subject: { institutionId } }, { gradeLevel: { institutionId } }] },
    });
    await tx.course.deleteMany({ where: { institutionId } });
    await tx.institutionAcademicConfiguration.deleteMany({ where: { institutionId } });
    await tx.gradeScale.deleteMany({ where: { gradingScheme: { institutionId } } });
    await tx.gradingScheme.deleteMany({ where: { institutionId } });
    await tx.evaluationTerm.deleteMany({ where: { institutionId } });
    await tx.assessmentCategory.deleteMany({ where: { institutionId } });
    await tx.academicTerm.deleteMany({ where: { academicPeriod: { institutionId } } });
    await tx.academicPeriod.deleteMany({ where: { institutionId } });
    await tx.subject.deleteMany({ where: { institutionId } });
    await tx.gradeLevel.deleteMany({ where: { institutionId } });
    await tx.academicLevel.deleteMany({ where: { institutionId } });
    await tx.studentProfile.deleteMany({ where: { institutionId } });
    await tx.teacherProfile.deleteMany({ where: { institutionId } });
    await tx.representativeProfile.deleteMany({ where: { institutionId } });
    await tx.institutionMembership.deleteMany({ where: { institutionId } });

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

    return { createdUsers: accounts.length };
  }, { maxWait: 10000, timeout: 60000 });

  console.log(JSON.stringify({ institution, createdUsers: result.createdUsers, accounts }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
