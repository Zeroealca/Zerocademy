import { createHash } from 'crypto';
import type { PrismaClient } from '@prisma/client';
import {
  AcademicPeriodStatus,
  AcademicRegime,
  EnrollmentStatus,
  Gender,
  InstitutionMembershipRole,
  InstitutionRegion,
  Role,
  RoundingStrategy,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES,
  ECUADOR_DEFAULT_SCHEME_NAME,
  ECUADOR_EVALUATION_TERM_TEMPLATES,
  ECUADOR_GRADING_SCHEME,
} from './ecuador-evaluation.data';
import {
  DEMO_CURRENT_PERIOD_NAME,
  DEMO_FORMATIVE_ASSESSMENT_TITLE,
  DEMO_GRADES_ASSESSMENT_TITLE,
  DEMO_GRADES_CREDENTIALS,
  DEMO_GRADES_INSTITUTION_CODE,
  DEMO_INSTITUTION_PROFILE,
  DEMO_PREVIOUS_PERIOD_NAME,
  DEMO_REVOKED_REFRESH_TOKEN_SEED,
  DEMO_VALIDATION_STUDENTS,
  type DemoCourseSlot,
} from './grades-demo.data';
import { seedLog } from './seed-logger';
import { buildRunSummary, emptyCounters, logRunSummary } from './seed-summary';
import type {
  SeedContext,
  SeedCounters,
  SeedRunSummary,
  SeedStepResult,
} from './types';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10);
  return bcrypt.hash(password, saltRounds);
}

function hashSeedToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
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

async function upsertMembership(
  ctx: SeedContext,
  institutionId: string,
  userId: string,
  role: InstitutionMembershipRole,
): Promise<void> {
  await ctx.prisma.institutionMembership.upsert({
    where: {
      institutionId_userId: { institutionId, userId },
    },
    create: {
      institutionId,
      userId,
      role,
      isActive: true,
    },
    update: { isActive: true, role },
  });
}

async function upsertPeriod(
  ctx: SeedContext,
  data: {
    institutionId: string;
    name: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    status: AcademicPeriodStatus;
  },
): Promise<{ id: string; inserted: boolean }> {
  const existing = await ctx.prisma.academicPeriod.findFirst({
    where: { institutionId: data.institutionId, name: data.name },
  });

  if (!existing) {
    const created = await ctx.prisma.academicPeriod.create({
      data: {
        name: data.name,
        institutionId: data.institutionId,
        regime: AcademicRegime.SIERRA_AMAZONIA,
        startDate: data.startDate,
        endDate: data.endDate,
        isActive: data.isActive,
        status: data.status,
      },
    });
    return { id: created.id, inserted: true };
  }

  await ctx.prisma.academicPeriod.update({
    where: { id: existing.id },
    data: {
      isActive: data.isActive,
      status: data.status,
      startDate: data.startDate,
      endDate: data.endDate,
    },
  });
  return { id: existing.id, inserted: false };
}

async function upsertTerms(
  ctx: SeedContext,
  academicPeriodId: string,
  terms: Array<{
    name: string;
    order: number;
    startDate: Date;
    endDate: Date;
  }>,
): Promise<Array<{ id: string; order: number }>> {
  const rows = [];
  for (const term of terms) {
    const row = await ctx.prisma.academicTerm.upsert({
      where: {
        academicPeriodId_order: {
          academicPeriodId,
          order: term.order,
        },
      },
      create: { ...term, academicPeriodId },
      update: term,
    });
    rows.push({ id: row.id, order: row.order });
  }
  return rows;
}

async function upsertCourse(
  ctx: SeedContext,
  data: {
    name: string;
    section: string;
    institutionId: string;
    academicPeriodId: string;
    gradeLevelId: string;
  },
): Promise<string> {
  const course = await ctx.prisma.course.upsert({
    where: {
      academicPeriodId_gradeLevelId_section: {
        academicPeriodId: data.academicPeriodId,
        gradeLevelId: data.gradeLevelId,
        section: data.section,
      },
    },
    create: { ...data, isActive: true },
    update: { isActive: true, name: data.name },
  });
  return course.id;
}

async function upsertStudentEnrollment(
  ctx: SeedContext,
  data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    nationalId: string;
    gender: Gender;
    birthDate: string;
    institutionId: string;
    courseId: string;
    academicPeriodId: string;
    status: EnrollmentStatus;
    enrollmentDate: Date;
  },
): Promise<{ userId: string; profileId: string }> {
  const userId = await upsertUser(ctx, {
    email: data.email,
    password: data.password,
    firstName: data.firstName,
    lastName: data.lastName,
    role: Role.STUDENT,
  });

  const profile = await ctx.prisma.studentProfile.upsert({
    where: { userId },
    create: {
      userId,
      institutionId: data.institutionId,
      nationalId: data.nationalId,
      gender: data.gender,
      birthDate: new Date(data.birthDate),
      phone: '0990000000',
      address: DEMO_INSTITUTION_PROFILE.address,
      emergencyContact: '0991112233',
      isActive: true,
    },
    update: {
      institutionId: data.institutionId,
      nationalId: data.nationalId,
      gender: data.gender,
      birthDate: new Date(data.birthDate),
      isActive: true,
    },
  });

  await ctx.prisma.enrollment.upsert({
    where: {
      studentId_courseId_academicPeriodId: {
        studentId: profile.id,
        courseId: data.courseId,
        academicPeriodId: data.academicPeriodId,
      },
    },
    create: {
      studentId: profile.id,
      courseId: data.courseId,
      academicPeriodId: data.academicPeriodId,
      enrollmentDate: data.enrollmentDate,
      status: data.status,
    },
    update: { status: data.status },
  });

  return { userId, profileId: profile.id };
}

async function ensureInstitutionEvaluation(
  ctx: SeedContext,
  institutionId: string,
  activePeriodId: string,
): Promise<{ schemeId: string; categoryIds: { formative: string; summative: string } }> {
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

  for (const template of ECUADOR_EVALUATION_TERM_TEMPLATES) {
    await ctx.prisma.evaluationTerm.upsert({
      where: {
        institutionId_academicPeriodId_order: {
          institutionId,
          academicPeriodId: activePeriodId,
          order: template.order,
        },
      },
      create: {
        institutionId,
        academicPeriodId: activePeriodId,
        name: template.name,
        order: template.order,
        weight: template.weight,
        isActive: true,
      },
      update: {
        name: template.name,
        weight: template.weight,
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

  const formative = await ctx.prisma.assessmentCategory.findFirstOrThrow({
    where: {
      institutionId,
      name: ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES[0].name,
      isActive: true,
    },
    select: { id: true },
  });

  const summative = await ctx.prisma.assessmentCategory.findFirstOrThrow({
    where: {
      institutionId,
      name: ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES[1].name,
      isActive: true,
    },
    select: { id: true },
  });

  return {
    schemeId: institutionScheme.id,
    categoryIds: { formative: formative.id, summative: summative.id },
  };
}

async function upsertAssessment(ctx: SeedContext, data: {
  institutionId: string;
  academicPeriodId: string;
  academicTermId: string;
  subjectId: string;
  teacherAssignmentId: string;
  assessmentCategoryId: string;
  title: string;
  description: string;
  maxScore: number;
  weight: number;
  assessmentDate: Date;
}): Promise<{ id: string; inserted: boolean }> {
  const existing = await ctx.prisma.assessment.findFirst({
    where: {
      institutionId: data.institutionId,
      title: data.title,
      teacherAssignmentId: data.teacherAssignmentId,
    },
  });

  if (existing) {
    return { id: existing.id, inserted: false };
  }

  const created = await ctx.prisma.assessment.create({ data });
  return { id: created.id, inserted: true };
}

async function runGradesDemoStep(ctx: SeedContext): Promise<SeedStepResult> {
  const counters: SeedCounters = emptyCounters();

  if (ctx.dryRun) {
    seedLog({
      event: 'GRADES_DEMO_DRY_RUN',
      message:
        'Dry run: would seed demo institution covering all current tables',
    });
    counters.inserted += 1;
    return { step: 'grades-demo', ...counters };
  }

  const gradeLevel = await ctx.prisma.gradeLevel.findFirst({
    where: { code: 'EGB-8', institutionId: null },
    select: { id: true },
  });

  const mathSubject = await ctx.prisma.subject.findFirst({
    where: { code: 'MATEMATICA', institutionId: null },
    select: { id: true },
  });

  const languageSubject = await ctx.prisma.subject.findFirst({
    where: { code: 'LENGUA_LIT', institutionId: null },
    select: { id: true },
  });

  if (!gradeLevel || !mathSubject || !languageSubject) {
    throw new Error(
      'Ecuador catalog missing EGB-8, MATEMATICA, or LENGUA_LIT — run catalog seeds first',
    );
  }

  const institution = await ctx.prisma.institution.upsert({
    where: { code: DEMO_GRADES_INSTITUTION_CODE },
    create: {
      code: DEMO_GRADES_INSTITUTION_CODE,
      ...DEMO_INSTITUTION_PROFILE,
      region: InstitutionRegion.SIERRA,
      regime: AcademicRegime.SIERRA_AMAZONIA,
      isActive: true,
    },
    update: {
      ...DEMO_INSTITUTION_PROFILE,
      region: InstitutionRegion.SIERRA,
      regime: AcademicRegime.SIERRA_AMAZONIA,
      isActive: true,
    },
  });
  counters.updated += 1;

  const previousPeriod = await upsertPeriod(ctx, {
    institutionId: institution.id,
    name: DEMO_PREVIOUS_PERIOD_NAME,
    startDate: new Date('2024-09-01'),
    endDate: new Date('2025-07-31'),
    isActive: false,
    status: AcademicPeriodStatus.CLOSED,
  });
  counters[previousPeriod.inserted ? 'inserted' : 'updated'] += 1;

  const currentPeriod = await upsertPeriod(ctx, {
    institutionId: institution.id,
    name: DEMO_CURRENT_PERIOD_NAME,
    startDate: new Date('2025-09-01'),
    endDate: new Date('2026-07-31'),
    isActive: true,
    status: AcademicPeriodStatus.ACTIVE,
  });
  counters[currentPeriod.inserted ? 'inserted' : 'updated'] += 1;

  await ctx.prisma.institution.update({
    where: { id: institution.id },
    data: { activeAcademicPeriodId: currentPeriod.id },
  });

  await upsertTerms(ctx, previousPeriod.id, [
    {
      name: 'Primer quimestre',
      order: 1,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-31'),
    },
    {
      name: 'Segundo quimestre',
      order: 2,
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-07-31'),
    },
  ]);

  const currentTerms = await upsertTerms(ctx, currentPeriod.id, [
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
  ]);

  const { schemeId, categoryIds } = await ensureInstitutionEvaluation(
    ctx,
    institution.id,
    currentPeriod.id,
  );

  const courseCurrentA = await upsertCourse(ctx, {
    name: 'Octavo de EGB',
    section: 'A',
    institutionId: institution.id,
    academicPeriodId: currentPeriod.id,
    gradeLevelId: gradeLevel.id,
  });

  const courseCurrentB = await upsertCourse(ctx, {
    name: 'Octavo de EGB',
    section: 'B',
    institutionId: institution.id,
    academicPeriodId: currentPeriod.id,
    gradeLevelId: gradeLevel.id,
  });

  const coursePreviousA = await upsertCourse(ctx, {
    name: 'Octavo de EGB',
    section: 'A',
    institutionId: institution.id,
    academicPeriodId: previousPeriod.id,
    gradeLevelId: gradeLevel.id,
  });

  const coursesBySlot: Record<DemoCourseSlot, { courseId: string; periodId: string; enrollmentDate: Date }> =
    {
      'current-A': {
        courseId: courseCurrentA,
        periodId: currentPeriod.id,
        enrollmentDate: new Date('2025-09-01'),
      },
      'current-B': {
        courseId: courseCurrentB,
        periodId: currentPeriod.id,
        enrollmentDate: new Date('2025-09-01'),
      },
      'previous-A': {
        courseId: coursePreviousA,
        periodId: previousPeriod.id,
        enrollmentDate: new Date('2024-09-01'),
      },
    };

  const adminUserId = await upsertUser(ctx, {
    ...DEMO_GRADES_CREDENTIALS.admin,
    firstName: 'Admin',
    lastName: 'Demo',
    role: Role.ADMIN,
  });
  await upsertMembership(
    ctx,
    institution.id,
    adminUserId,
    InstitutionMembershipRole.ADMIN,
  );

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

  await upsertMembership(
    ctx,
    institution.id,
    teacherUserId,
    InstitutionMembershipRole.TEACHER,
  );

  const representativeUserId = await upsertUser(ctx, {
    email: DEMO_GRADES_CREDENTIALS.representative.email,
    password: DEMO_GRADES_CREDENTIALS.representative.password,
    firstName: DEMO_GRADES_CREDENTIALS.representative.firstName,
    lastName: DEMO_GRADES_CREDENTIALS.representative.lastName,
    role: Role.REPRESENTATIVE,
  });

  await ctx.prisma.representativeProfile.upsert({
    where: { userId: representativeUserId },
    create: {
      userId: representativeUserId,
      institutionId: institution.id,
    },
    update: { institutionId: institution.id },
  });

  const mathAssignment = await ctx.prisma.teacherAssignment.upsert({
    where: {
      teacherId_subjectId_courseId_academicPeriodId: {
        teacherId: teacherProfile.id,
        subjectId: mathSubject.id,
        courseId: courseCurrentA,
        academicPeriodId: currentPeriod.id,
      },
    },
    create: {
      institutionId: institution.id,
      teacherId: teacherProfile.id,
      subjectId: mathSubject.id,
      courseId: courseCurrentA,
      academicPeriodId: currentPeriod.id,
    },
    update: { institutionId: institution.id },
  });

  await ctx.prisma.teacherAssignment.upsert({
    where: {
      teacherId_subjectId_courseId_academicPeriodId: {
        teacherId: teacherProfile.id,
        subjectId: languageSubject.id,
        courseId: courseCurrentB,
        academicPeriodId: currentPeriod.id,
      },
    },
    create: {
      institutionId: institution.id,
      teacherId: teacherProfile.id,
      subjectId: languageSubject.id,
      courseId: courseCurrentB,
      academicPeriodId: currentPeriod.id,
    },
    update: { institutionId: institution.id },
  });

  const primaryStudentProfiles: Array<{ id: string }> = [];

  for (const student of DEMO_GRADES_CREDENTIALS.students) {
    const seeded = await upsertStudentEnrollment(ctx, {
      ...student,
      institutionId: institution.id,
      courseId: courseCurrentA,
      academicPeriodId: currentPeriod.id,
      status: EnrollmentStatus.ACTIVE,
      enrollmentDate: new Date('2025-09-01'),
    });
    primaryStudentProfiles.push({ id: seeded.profileId });
  }

  for (const student of DEMO_VALIDATION_STUDENTS) {
    const slot = coursesBySlot[student.course];
    await upsertStudentEnrollment(ctx, {
      ...student,
      institutionId: institution.id,
      courseId: slot.courseId,
      academicPeriodId: slot.periodId,
      status: student.status,
      enrollmentDate: slot.enrollmentDate,
    });
    counters.updated += 1;
  }

  const firstTerm = currentTerms[0];
  const summativeAssessment = await upsertAssessment(ctx, {
    institutionId: institution.id,
    academicPeriodId: currentPeriod.id,
    academicTermId: firstTerm.id,
    subjectId: mathSubject.id,
    teacherAssignmentId: mathAssignment.id,
    assessmentCategoryId: categoryIds.summative,
    title: DEMO_GRADES_ASSESSMENT_TITLE,
    description: 'Sample assessment for grades module demo and e2e tests',
    maxScore: 10,
    weight: 20,
    assessmentDate: new Date('2025-10-15'),
  });
  counters[summativeAssessment.inserted ? 'inserted' : 'skipped'] += 1;

  const formativeAssessment = await upsertAssessment(ctx, {
    institutionId: institution.id,
    academicPeriodId: currentPeriod.id,
    academicTermId: firstTerm.id,
    subjectId: mathSubject.id,
    teacherAssignmentId: mathAssignment.id,
    assessmentCategoryId: categoryIds.formative,
    title: DEMO_FORMATIVE_ASSESSMENT_TITLE,
    description: 'Formative classwork sample for academic performance screens',
    maxScore: 10,
    weight: 10,
    assessmentDate: new Date('2025-10-08'),
  });
  counters[formativeAssessment.inserted ? 'inserted' : 'skipped'] += 1;

  const demoScores = [8.5, 7.25];
  const formativeScores = [9.0, 8.0];

  for (let index = 0; index < primaryStudentProfiles.length; index += 1) {
    const enrollment = await ctx.prisma.enrollment.findUniqueOrThrow({
      where: {
        studentId_courseId_academicPeriodId: {
          studentId: primaryStudentProfiles[index].id,
          courseId: courseCurrentA,
          academicPeriodId: currentPeriod.id,
        },
      },
    });

    await ctx.prisma.grade.upsert({
      where: {
        assessmentId_enrollmentId: {
          assessmentId: summativeAssessment.id,
          enrollmentId: enrollment.id,
        },
      },
      create: {
        assessmentId: summativeAssessment.id,
        enrollmentId: enrollment.id,
        score: demoScores[index] ?? 7,
        observations: 'Seeded demo grade',
        gradingSchemeId: schemeId,
      },
      update: {
        score: demoScores[index] ?? 7,
        gradingSchemeId: schemeId,
      },
    });

    await ctx.prisma.grade.upsert({
      where: {
        assessmentId_enrollmentId: {
          assessmentId: formativeAssessment.id,
          enrollmentId: enrollment.id,
        },
      },
      create: {
        assessmentId: formativeAssessment.id,
        enrollmentId: enrollment.id,
        score: formativeScores[index] ?? 8,
        observations: 'Seeded formative grade',
        gradingSchemeId: schemeId,
      },
      update: {
        score: formativeScores[index] ?? 8,
        gradingSchemeId: schemeId,
      },
    });
    counters.updated += 1;
  }

  const existingTransition = await ctx.prisma.academicPeriodTransition.findFirst({
    where: {
      institutionId: institution.id,
      fromAcademicPeriodId: previousPeriod.id,
      toAcademicPeriodId: currentPeriod.id,
    },
  });

  if (!existingTransition) {
    await ctx.prisma.academicPeriodTransition.create({
      data: {
        institutionId: institution.id,
        fromAcademicPeriodId: previousPeriod.id,
        toAcademicPeriodId: currentPeriod.id,
        executedById: adminUserId,
        copiedCourses: true,
        copiedAssignments: true,
        copiedStructures: true,
        copiedTerms: true,
      },
    });
    counters.inserted += 1;
  } else {
    counters.skipped += 1;
  }

  const revokedTokenHash = hashSeedToken(DEMO_REVOKED_REFRESH_TOKEN_SEED);
  await ctx.prisma.refreshToken.upsert({
    where: { tokenHash: revokedTokenHash },
    create: {
      userId: adminUserId,
      tokenHash: revokedTokenHash,
      expiresAt: new Date('2025-01-01T00:00:00.000Z'),
      revokedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
    update: {
      userId: adminUserId,
      expiresAt: new Date('2025-01-01T00:00:00.000Z'),
      revokedAt: new Date('2025-01-01T00:00:00.000Z'),
    },
  });
  counters.updated += 1;

  const platformAdminEmail = (
    process.env.SEED_ADMIN_EMAIL ?? 'admin@zerocademy.edu'
  ).toLowerCase();

  await ctx.prisma.user.updateMany({
    where: {
      email: {
        in: [
          platformAdminEmail,
          DEMO_GRADES_CREDENTIALS.admin.email,
          DEMO_GRADES_CREDENTIALS.teacher.email,
          ...DEMO_GRADES_CREDENTIALS.students.map((student) => student.email),
        ],
      },
    },
    data: { selectedAcademicPeriodId: currentPeriod.id },
  });

  seedLog({
    event: 'GRADES_DEMO_SEEDED',
    message:
      'Demo institution ready with users, periods, enrollments, evaluation, grades, and transition audit',
    metadata: {
      institutionCode: DEMO_GRADES_INSTITUTION_CODE,
      institutionId: institution.id,
      periodId: currentPeriod.id,
      assessmentId: summativeAssessment.id,
      teacherEmail: DEMO_GRADES_CREDENTIALS.teacher.email,
    },
  });

  return { step: 'grades-demo', ...counters };
}

/**
 * Seeds a demo institution covering every current Prisma table for QA.
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
    : await prisma.$transaction(
        async (tx) => runGradesDemoStep({ prisma: tx, dryRun: false }),
        { timeout: 120_000 },
      );

  const summary = buildRunSummary([step], startedAt);
  logRunSummary(summary);

  return summary;
}

export { DEMO_GRADES_CREDENTIALS, DEMO_GRADES_INSTITUTION_CODE } from './grades-demo.data';
