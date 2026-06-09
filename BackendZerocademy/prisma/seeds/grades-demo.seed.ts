import type { PrismaClient } from '@prisma/client';
import {
  AcademicPeriodStatus,
  AcademicRegime,
  EnrollmentStatus,
  InstitutionMembershipRole,
  Role,
  RoundingStrategy,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES,
  ECUADOR_DEFAULT_SCHEME_NAME,
  ECUADOR_GRADING_SCHEME,
} from './ecuador-evaluation.data';
import {
  DEMO_GRADES_ASSESSMENT_TITLE,
  DEMO_GRADES_CREDENTIALS,
  DEMO_GRADES_INSTITUTION_CODE,
} from './grades-demo.data';
import { seedLog } from './seed-logger';
import { buildRunSummary, emptyCounters, logRunSummary } from './seed-summary';
import type { SeedContext, SeedRunSummary, SeedStepResult } from './types';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
  return bcrypt.hash(password, saltRounds);
}

async function upsertUser(
  ctx: SeedContext,
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
  },
): Promise<string> {
  const email = data.email.toLowerCase();
  const existing = await ctx.prisma.user.findUnique({ where: { email } });

  if (existing) {
    return existing.id;
  }

  const user = await ctx.prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isActive: true,
    },
  });

  return user.id;
}

async function ensureInstitutionEvaluation(
  ctx: SeedContext,
  institutionId: string,
  activePeriodId: string,
): Promise<{ schemeId: string; categoryId: string }> {
  const platformScheme = await ctx.prisma.gradingScheme.findFirst({
    where: { institutionId: null, name: ECUADOR_DEFAULT_SCHEME_NAME },
    include: { gradeScales: true },
  });

  if (!platformScheme) {
    throw new Error(
      'Platform Ecuador grading scheme missing — run catalog seeds first',
    );
  }

  let institutionScheme = await ctx.prisma.gradingScheme.findFirst({
    where: { institutionId, name: ECUADOR_DEFAULT_SCHEME_NAME },
  });

  if (!institutionScheme) {
    institutionScheme = await ctx.prisma.gradingScheme.create({
      data: {
        institutionId,
        name: platformScheme.name,
        minScore: platformScheme.minScore,
        maxScore: platformScheme.maxScore,
        passingScore: platformScheme.passingScore,
        decimalPlaces: platformScheme.decimalPlaces,
        isDefault: true,
        isActive: true,
        gradeScales: {
          create: platformScheme.gradeScales.map((scale) => ({
            code: scale.code,
            description: scale.description,
            minValue: scale.minValue,
            maxValue: scale.maxValue,
            order: scale.order,
          })),
        },
      },
    });
  }

  for (const template of ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES) {
    await ctx.prisma.assessmentCategory.upsert({
      where: {
        institutionId_name: {
          institutionId,
          name: template.name,
        },
      },
      create: {
        institutionId,
        name: template.name,
        weight: template.weight,
        description: template.description,
        isActive: true,
      },
      update: {
        weight: template.weight,
        description: template.description,
        isActive: true,
      },
    });
  }

  await ctx.prisma.institutionAcademicConfiguration.upsert({
    where: { institutionId },
    create: {
      institutionId,
      gradingSchemeId: institutionScheme.id,
      activeAcademicPeriodId: activePeriodId,
      roundingStrategy: RoundingStrategy.ROUND_HALF_UP,
      decimalPlaces: ECUADOR_GRADING_SCHEME.decimalPlaces,
    },
    update: {
      gradingSchemeId: institutionScheme.id,
      activeAcademicPeriodId: activePeriodId,
    },
  });

  const category = await ctx.prisma.assessmentCategory.findFirstOrThrow({
    where: {
      institutionId,
      name: ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES[1].name,
      isActive: true,
    },
    select: { id: true },
  });

  return { schemeId: institutionScheme.id, categoryId: category.id };
}

async function runGradesDemoStep(ctx: SeedContext): Promise<SeedStepResult> {
  const counters = emptyCounters();

  if (ctx.dryRun) {
    seedLog({
      event: 'GRADES_DEMO_DRY_RUN',
      message: 'Dry run: would seed grades demo institution and users',
    });
    counters.inserted += 1;
    return { step: 'grades-demo', ...counters };
  }

  const gradeLevel = await ctx.prisma.gradeLevel.findFirst({
    where: { code: 'EGB-8', institutionId: null },
    select: { id: true },
  });

  const subject = await ctx.prisma.subject.findFirst({
    where: { code: 'MATEMATICA', institutionId: null },
    select: { id: true },
  });

  if (!gradeLevel || !subject) {
    throw new Error(
      'Ecuador catalog missing EGB-8 or MATEMATICA — run catalog seeds first',
    );
  }

  const institution = await ctx.prisma.institution.upsert({
    where: { code: DEMO_GRADES_INSTITUTION_CODE },
    create: {
      code: DEMO_GRADES_INSTITUTION_CODE,
      name: 'Escuela Demo Calificaciones',
      regime: AcademicRegime.SIERRA_AMAZONIA,
      isActive: true,
    },
    update: { isActive: true },
  });
  counters.updated += 1;

  let period = await ctx.prisma.academicPeriod.findFirst({
    where: { institutionId: institution.id, name: '2025-2026 Demo' },
  });

  if (!period) {
    period = await ctx.prisma.academicPeriod.create({
      data: {
        name: '2025-2026 Demo',
        institutionId: institution.id,
        regime: AcademicRegime.SIERRA_AMAZONIA,
        startDate: new Date('2025-09-01'),
        endDate: new Date('2026-07-31'),
        isActive: true,
        status: AcademicPeriodStatus.ACTIVE,
      },
    });
    counters.inserted += 1;
  } else {
    period = await ctx.prisma.academicPeriod.update({
      where: { id: period.id },
      data: {
        isActive: true,
        status: AcademicPeriodStatus.ACTIVE,
      },
    });
    counters.updated += 1;
  }

  await ctx.prisma.institution.update({
    where: { id: institution.id },
    data: { activeAcademicPeriodId: period.id },
  });

  const termDefinitions = [
    {
      name: 'Primer quimestre',
      order: 1,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-31'),
    },
    {
      name: 'Segundo quimestre',
      order: 2,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-07-31'),
    },
  ];

  const terms = [];
  for (const term of termDefinitions) {
    const row = await ctx.prisma.academicTerm.upsert({
      where: {
        academicPeriodId_order: {
          academicPeriodId: period.id,
          order: term.order,
        },
      },
      create: {
        ...term,
        academicPeriodId: period.id,
      },
      update: term,
    });
    terms.push(row);
  }

  const { categoryId } = await ensureInstitutionEvaluation(
    ctx,
    institution.id,
    period.id,
  );

  const course = await ctx.prisma.course.upsert({
    where: {
      academicPeriodId_gradeLevelId_section: {
        academicPeriodId: period.id,
        gradeLevelId: gradeLevel.id,
        section: 'A',
      },
    },
    create: {
      name: 'Octavo de EGB',
      section: 'A',
      institutionId: institution.id,
      academicPeriodId: period.id,
      gradeLevelId: gradeLevel.id,
      isActive: true,
    },
    update: { isActive: true },
  });

  const adminUserId = await upsertUser(ctx, {
    ...DEMO_GRADES_CREDENTIALS.admin,
    firstName: 'Admin',
    lastName: 'Demo',
    role: Role.ADMIN,
  });

  await ctx.prisma.institutionMembership.upsert({
    where: {
      institutionId_userId: {
        institutionId: institution.id,
        userId: adminUserId,
      },
    },
    create: {
      institutionId: institution.id,
      userId: adminUserId,
      role: InstitutionMembershipRole.ADMIN,
      isActive: true,
    },
    update: { isActive: true },
  });

  const teacherUserId = await upsertUser(ctx, {
    ...DEMO_GRADES_CREDENTIALS.teacher,
    firstName: 'María',
    lastName: 'Docente',
    role: Role.TEACHER,
  });

  const teacherProfile = await ctx.prisma.teacherProfile.upsert({
    where: { userId: teacherUserId },
    create: {
      userId: teacherUserId,
      institutionId: institution.id,
    },
    update: { institutionId: institution.id },
  });

  await ctx.prisma.institutionMembership.upsert({
    where: {
      institutionId_userId: {
        institutionId: institution.id,
        userId: teacherUserId,
      },
    },
    create: {
      institutionId: institution.id,
      userId: teacherUserId,
      role: InstitutionMembershipRole.TEACHER,
      isActive: true,
    },
    update: { isActive: true },
  });

  const teacherAssignment = await ctx.prisma.teacherAssignment.upsert({
    where: {
      teacherId_subjectId_courseId_academicPeriodId: {
        teacherId: teacherProfile.id,
        subjectId: subject.id,
        courseId: course.id,
        academicPeriodId: period.id,
      },
    },
    create: {
      institutionId: institution.id,
      teacherId: teacherProfile.id,
      subjectId: subject.id,
      courseId: course.id,
      academicPeriodId: period.id,
    },
    update: { institutionId: institution.id },
  });

  const studentProfiles = [];
  for (const student of DEMO_GRADES_CREDENTIALS.students) {
    const userId = await upsertUser(ctx, {
      email: student.email,
      password: student.password,
      firstName: student.firstName,
      lastName: student.lastName,
      role: Role.STUDENT,
    });

    const profile = await ctx.prisma.studentProfile.upsert({
      where: { userId },
      create: {
        userId,
        institutionId: institution.id,
        isActive: true,
      },
      update: { institutionId: institution.id, isActive: true },
    });

    await ctx.prisma.enrollment.upsert({
      where: {
        studentId_courseId_academicPeriodId: {
          studentId: profile.id,
          courseId: course.id,
          academicPeriodId: period.id,
        },
      },
      create: {
        studentId: profile.id,
        courseId: course.id,
        academicPeriodId: period.id,
        enrollmentDate: new Date('2025-09-01'),
        status: EnrollmentStatus.ACTIVE,
      },
      update: { status: EnrollmentStatus.ACTIVE },
    });

    studentProfiles.push(profile);
  }

  const firstTerm = terms[0];
  let assessment = await ctx.prisma.assessment.findFirst({
    where: {
      institutionId: institution.id,
      title: DEMO_GRADES_ASSESSMENT_TITLE,
      teacherAssignmentId: teacherAssignment.id,
    },
  });

  if (!assessment) {
    assessment = await ctx.prisma.assessment.create({
      data: {
        institutionId: institution.id,
        academicPeriodId: period.id,
        academicTermId: firstTerm.id,
        subjectId: subject.id,
        teacherAssignmentId: teacherAssignment.id,
        assessmentCategoryId: categoryId,
        title: DEMO_GRADES_ASSESSMENT_TITLE,
        description: 'Sample assessment for grades module demo and e2e tests',
        maxScore: 10,
        weight: 20,
        assessmentDate: new Date('2025-10-15'),
      },
    });
    counters.inserted += 1;
  } else {
    counters.skipped += 1;
  }

  const scheme = await ctx.prisma.institutionAcademicConfiguration.findUnique({
    where: { institutionId: institution.id },
    select: { gradingSchemeId: true },
  });

  const demoScores = [8.5, 7.25];
  for (let index = 0; index < studentProfiles.length; index += 1) {
    const enrollment = await ctx.prisma.enrollment.findUniqueOrThrow({
      where: {
        studentId_courseId_academicPeriodId: {
          studentId: studentProfiles[index].id,
          courseId: course.id,
          academicPeriodId: period.id,
        },
      },
    });

    await ctx.prisma.grade.upsert({
      where: {
        assessmentId_enrollmentId: {
          assessmentId: assessment.id,
          enrollmentId: enrollment.id,
        },
      },
      create: {
        assessmentId: assessment.id,
        enrollmentId: enrollment.id,
        score: demoScores[index] ?? 7,
        observations: 'Seeded demo grade',
        gradingSchemeId: scheme?.gradingSchemeId,
      },
      update: {
        score: demoScores[index] ?? 7,
        gradingSchemeId: scheme?.gradingSchemeId,
      },
    });
    counters.updated += 1;
  }

  await ctx.prisma.user.updateMany({
    where: {
      id: { in: [teacherUserId, ...studentProfiles.map((p) => p.userId)] },
    },
    data: { selectedAcademicPeriodId: period.id },
  });

  seedLog({
    event: 'GRADES_DEMO_SEEDED',
    message: 'Grades demo institution, users, assessment, and grades ready',
    metadata: {
      institutionCode: DEMO_GRADES_INSTITUTION_CODE,
      institutionId: institution.id,
      periodId: period.id,
      assessmentId: assessment.id,
      teacherEmail: DEMO_GRADES_CREDENTIALS.teacher.email,
    },
  });

  return { step: 'grades-demo', ...counters };
}

/**
 * Seeds a demo institution with teacher, students, assessment, and grades.
 * Requires Ecuador catalog + platform evaluation defaults.
 */
export async function seedGradesDemo(
  prisma: PrismaClient,
  options?: { dryRun?: boolean },
): Promise<SeedRunSummary> {
  const startedAt = Date.now();
  const ctx: SeedContext = { prisma, dryRun: options?.dryRun };

  seedLog({
    event: 'GRADES_DEMO_SEED_START',
    message: 'Starting grades demo seed',
    metadata: { dryRun: Boolean(options?.dryRun) },
  });

  const step = options?.dryRun
    ? await runGradesDemoStep(ctx)
    : await prisma.$transaction(async (tx) =>
        runGradesDemoStep({ prisma: tx, dryRun: false }),
      );

  const summary = buildRunSummary([step], startedAt);
  logRunSummary(summary);

  return summary;
}

export { DEMO_GRADES_CREDENTIALS, DEMO_GRADES_INSTITUTION_CODE } from './grades-demo.data';
