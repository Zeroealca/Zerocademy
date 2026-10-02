import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  AcademicPeriodStatus,
  AcademicRegime,
  EnrollmentStatus,
  InstitutionMembershipRole,
  InstitutionRegion,
  PrismaClient,
  RepresentativeRelationshipType,
  Role,
} from '@prisma/client';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runCatalogSeeds } from './index';
import { ensureInstitutionEvaluation } from './grades-demo.seed';
import { seedMembershipPermissionProfileAssignments } from './membership-permission-profiles.seed';
import { seedPermissionCatalog } from './permission-catalog.seed';
import { seedPermissionProfiles } from './permission-profiles.seed';

const configPath = resolve(__dirname, '../../../qa/qa-users.local.json');
const institutionCode = 'ZEROCademy-QA-LOCAL';
const periodName = 'QA Local 2026-2027';
const localHosts = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'postgres',
  'host.docker.internal',
]);

type QaRole = keyof typeof Role;

interface InstitutionContext {
  id: string | null;
  name: string;
}

interface TeacherContext {
  academicPeriodId: string | null;
  courseIds: string[];
  subjectIds: string[];
  teacherAssignmentIds: string[];
  excludedTeacherAssignmentIds: string[];
}

interface StudentContext {
  academicPeriodId: string | null;
  enrollmentId: string | null;
  courseId: string | null;
}

interface QaAccount {
  key: string;
  role: QaRole;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  institution: InstitutionContext | null;
  academicContext: TeacherContext | StudentContext | null;
  linkedStudentKeys?: string[];
  notes: string;
}

interface QaConfig {
  metadata: { purpose: string; lastVerifiedAt: string | null };
  environment: { name: string; frontendUrl: string; backendUrl: string };
  accounts: QaAccount[];
}

function isLocalHost(hostname: string): boolean {
  return localHosts.has(hostname.toLowerCase()) || hostname.startsWith('127.');
}

function assertLocalUrl(value: string, label: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} must be a valid URL.`);
  }
  if (!isLocalHost(url.hostname)) {
    throw new Error(
      `${label} must use a local host; received ${url.hostname}.`,
    );
  }
}

function assertLocalDatabase(): void {
  const value = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!value)
    throw new Error('DATABASE_URL or DATABASE_URL_UNPOOLED is required.');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL.');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !isLocalHost(url.hostname)
  ) {
    throw new Error(
      'QA setup only permits local PostgreSQL hosts (postgres, localhost, or loopback). Refusing this database target.',
    );
  }
}

function account(config: QaConfig, key: string, role: Role): QaAccount {
  const found = config.accounts.find((item) => item.key === key);
  if (!found || found.role !== role) {
    throw new Error(`Missing required QA account ${key} with role ${role}.`);
  }
  return found;
}

function assertConfig(config: QaConfig): void {
  if (config.environment.name !== 'local') {
    throw new Error(
      'qa-users.local.json environment.name must be exactly "local".',
    );
  }
  assertLocalUrl(config.environment.frontendUrl, 'environment.frontendUrl');
  assertLocalUrl(config.environment.backendUrl, 'environment.backendUrl');

  const required: ReadonlyArray<readonly [string, Role]> = [
    ['superAdmin', Role.SUPER_ADMIN],
    ['adminPrimary', Role.ADMIN],
    ['teacherPrimary', Role.TEACHER],
    ['teacherSecondary', Role.TEACHER],
    ['studentPrimary', Role.STUDENT],
    ['studentSecondary', Role.STUDENT],
    ['representativePrimary', Role.REPRESENTATIVE],
  ];
  required.forEach(([key, role]) => account(config, key, role));

  for (const item of config.accounts) {
    const missing = [item.firstName, item.lastName, item.email, item.password]
      .map(
        (value, index) =>
          [
            value,
            ['firstName', 'lastName', 'email', 'password'][index],
          ] as const,
      )
      .filter(([value]) => !value?.trim())
      .map(([, field]) => field);
    if (missing.length > 0) {
      throw new Error(
        `QA account ${item.key} is incomplete: ${missing.join(', ')}.`,
      );
    }
    if (item.password.length < 8) {
      throw new Error(
        `QA account ${item.key} password must be at least 8 characters.`,
      );
    }
  }
}

async function loadConfig(): Promise<QaConfig> {
  try {
    return JSON.parse(await readFile(configPath, 'utf8')) as QaConfig;
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error('qa-users.local.json contains invalid JSON.');
    throw new Error(`QA configuration not found at ${configPath}.`);
  }
}

async function upsertUser(
  prisma: PrismaClient,
  item: QaAccount,
  selectedAcademicPeriodId?: string,
): Promise<string> {
  const passwordHash = await bcrypt.hash(
    item.password,
    Number.parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  );
  const user = await prisma.user.upsert({
    where: { email: item.email.toLowerCase() },
    create: {
      email: item.email.toLowerCase(),
      passwordHash,
      firstName: item.firstName,
      lastName: item.lastName,
      role: item.role,
      isActive: true,
      selectedAcademicPeriodId,
    },
    update: {
      passwordHash,
      firstName: item.firstName,
      lastName: item.lastName,
      role: item.role,
      isActive: true,
      selectedAcademicPeriodId,
      deletedAt: null,
    },
  });
  return user.id;
}

function updateInstitution(item: QaAccount, id: string, name: string): void {
  if (item.institution) Object.assign(item.institution, { id, name });
}

function teacherContext(item: QaAccount): TeacherContext {
  if (
    !item.academicContext ||
    !('teacherAssignmentIds' in item.academicContext)
  ) {
    throw new Error(`QA account ${item.key} has no teacher academicContext.`);
  }
  return item.academicContext;
}

function studentContext(item: QaAccount): StudentContext {
  if (!item.academicContext || !('enrollmentId' in item.academicContext)) {
    throw new Error(`QA account ${item.key} has no student academicContext.`);
  }
  return item.academicContext;
}

async function main(): Promise<void> {
  assertLocalDatabase();
  const config = await loadConfig();
  assertConfig(config);
  const prisma = new PrismaClient();

  try {
    await seedPermissionCatalog(prisma);
    await seedPermissionProfiles(prisma);
    await runCatalogSeeds(prisma, { catalogs: 'ecuador' });

    const [gradeLevel, math, language] = await Promise.all([
      prisma.gradeLevel.findFirst({
        where: { code: 'EGB-8', institutionId: null, isActive: true },
      }),
      prisma.subject.findFirst({
        where: { code: 'MATEMATICA', institutionId: null, isActive: true },
      }),
      prisma.subject.findFirst({
        where: { code: 'LENGUA_LIT', institutionId: null, isActive: true },
      }),
    ]);
    if (!gradeLevel || !math || !language) {
      throw new Error(
        'Canonical Ecuador catalog prerequisites are missing after seeding.',
      );
    }

    const institution = await prisma.institution.upsert({
      where: { code: institutionCode },
      create: {
        code: institutionCode,
        name: 'Zerocademy QA Local School',
        region: InstitutionRegion.SIERRA,
        regime: AcademicRegime.SIERRA_AMAZONIA,
        isActive: true,
      },
      update: { name: 'Zerocademy QA Local School', isActive: true },
    });
    let period = await prisma.academicPeriod.findFirst({
      where: { institutionId: institution.id, name: periodName },
    });
    if (!period) {
      period = await prisma.academicPeriod.create({
        data: {
          name: periodName,
          institutionId: institution.id,
          regime: AcademicRegime.SIERRA_AMAZONIA,
          startDate: new Date('2026-09-01'),
          endDate: new Date('2027-07-31'),
          isActive: false,
          status: AcademicPeriodStatus.PLANNED,
        },
      });
    }
    await prisma.academicPeriod.updateMany({
      where: {
        regime: AcademicRegime.SIERRA_AMAZONIA,
        isActive: true,
        id: { not: period.id },
      },
      data: { isActive: false, status: AcademicPeriodStatus.CLOSED },
    });
    period = await prisma.academicPeriod.update({
      where: { id: period.id },
      data: {
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-07-31'),
        isActive: true,
        status: AcademicPeriodStatus.ACTIVE,
      },
    });
    await prisma.institution.update({
      where: { id: institution.id },
      data: { activeAcademicPeriodId: period.id },
    });

    for (const term of [
      {
        name: 'Primer quimestre',
        order: 1,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2027-01-31'),
      },
      {
        name: 'Segundo quimestre',
        order: 2,
        startDate: new Date('2027-02-01'),
        endDate: new Date('2027-07-31'),
      },
    ]) {
      await prisma.academicTerm.upsert({
        where: {
          academicPeriodId_order: {
            academicPeriodId: period.id,
            order: term.order,
          },
        },
        create: { ...term, academicPeriodId: period.id },
        update: term,
      });
    }
    await ensureInstitutionEvaluation({ prisma }, institution.id, period.id);

    const course = await prisma.course.upsert({
      where: {
        academicPeriodId_gradeLevelId_section: {
          academicPeriodId: period.id,
          gradeLevelId: gradeLevel.id,
          section: 'QA-A',
        },
      },
      create: {
        name: 'Octavo de EGB QA Local',
        section: 'QA-A',
        institutionId: institution.id,
        academicPeriodId: period.id,
        gradeLevelId: gradeLevel.id,
        isActive: true,
      },
      update: {
        name: 'Octavo de EGB QA Local',
        institutionId: institution.id,
        isActive: true,
      },
    });

    const superAdmin = account(config, 'superAdmin', Role.SUPER_ADMIN);
    const admin = account(config, 'adminPrimary', Role.ADMIN);
    const primaryTeacher = account(config, 'teacherPrimary', Role.TEACHER);
    const secondaryTeacher = account(config, 'teacherSecondary', Role.TEACHER);
    const primaryStudent = account(config, 'studentPrimary', Role.STUDENT);
    const secondaryStudent = account(config, 'studentSecondary', Role.STUDENT);
    const representative = account(
      config,
      'representativePrimary',
      Role.REPRESENTATIVE,
    );

    await upsertUser(prisma, superAdmin);
    const adminId = await upsertUser(prisma, admin, period.id);
    const primaryTeacherId = await upsertUser(
      prisma,
      primaryTeacher,
      period.id,
    );
    const secondaryTeacherId = await upsertUser(
      prisma,
      secondaryTeacher,
      period.id,
    );
    const primaryStudentId = await upsertUser(
      prisma,
      primaryStudent,
      period.id,
    );
    const secondaryStudentId = await upsertUser(
      prisma,
      secondaryStudent,
      period.id,
    );
    const representativeId = await upsertUser(prisma, representative);

    for (const [userId, role] of [
      [adminId, InstitutionMembershipRole.ADMIN],
      [primaryTeacherId, InstitutionMembershipRole.TEACHER],
      [secondaryTeacherId, InstitutionMembershipRole.TEACHER],
    ] as const) {
      await prisma.institutionMembership.upsert({
        where: {
          institutionId_userId: { institutionId: institution.id, userId },
        },
        create: { institutionId: institution.id, userId, role, isActive: true },
        update: { role, isActive: true },
      });
    }

    const primaryTeacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: primaryTeacherId },
      create: { userId: primaryTeacherId, institutionId: institution.id },
      update: { institutionId: institution.id },
    });
    const secondaryTeacherProfile = await prisma.teacherProfile.upsert({
      where: { userId: secondaryTeacherId },
      create: { userId: secondaryTeacherId, institutionId: institution.id },
      update: { institutionId: institution.id },
    });
    const primaryAssignment = await prisma.teacherAssignment.upsert({
      where: {
        teacherId_subjectId_courseId_academicPeriodId: {
          teacherId: primaryTeacherProfile.id,
          subjectId: math.id,
          courseId: course.id,
          academicPeriodId: period.id,
        },
      },
      create: {
        institutionId: institution.id,
        teacherId: primaryTeacherProfile.id,
        subjectId: math.id,
        courseId: course.id,
        academicPeriodId: period.id,
      },
      update: { institutionId: institution.id },
    });
    const secondaryAssignment = await prisma.teacherAssignment.upsert({
      where: {
        teacherId_subjectId_courseId_academicPeriodId: {
          teacherId: secondaryTeacherProfile.id,
          subjectId: language.id,
          courseId: course.id,
          academicPeriodId: period.id,
        },
      },
      create: {
        institutionId: institution.id,
        teacherId: secondaryTeacherProfile.id,
        subjectId: language.id,
        courseId: course.id,
        academicPeriodId: period.id,
      },
      update: { institutionId: institution.id },
    });

    const students = new Map<string, { id: string; enrollmentId: string }>();
    for (const [item, userId] of [
      [primaryStudent, primaryStudentId],
      [secondaryStudent, secondaryStudentId],
    ] as const) {
      const profile = await prisma.studentProfile.upsert({
        where: { userId },
        create: { userId, institutionId: institution.id, isActive: true },
        update: { institutionId: institution.id, isActive: true },
      });
      const enrollment = await prisma.enrollment.upsert({
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
          enrollmentDate: new Date('2026-09-01'),
          status: EnrollmentStatus.ACTIVE,
        },
        update: { status: EnrollmentStatus.ACTIVE },
      });
      students.set(item.key, { id: profile.id, enrollmentId: enrollment.id });
    }

    await prisma.representativeProfile.upsert({
      where: { userId: representativeId },
      create: { userId: representativeId, institutionId: institution.id },
      update: { institutionId: institution.id },
    });
    for (const studentKey of representative.linkedStudentKeys ?? []) {
      const student = students.get(studentKey);
      if (!student)
        throw new Error(
          `Representative references unsupported student key ${studentKey}.`,
        );
      await prisma.representativeStudent.upsert({
        where: {
          representativeUserId_studentId: {
            representativeUserId: representativeId,
            studentId: student.id,
          },
        },
        create: {
          representativeUserId: representativeId,
          studentId: student.id,
          relationshipType: RepresentativeRelationshipType.LEGAL_GUARDIAN,
          isPrimary: studentKey === 'studentPrimary',
          isActive: true,
        },
        update: { isPrimary: studentKey === 'studentPrimary', isActive: true },
      });
    }
    await seedMembershipPermissionProfileAssignments(prisma);

    for (const item of [
      admin,
      primaryTeacher,
      secondaryTeacher,
      primaryStudent,
      secondaryStudent,
      representative,
    ]) {
      updateInstitution(item, institution.id, institution.name);
    }
    Object.assign(teacherContext(primaryTeacher), {
      academicPeriodId: period.id,
      courseIds: [course.id],
      subjectIds: [math.id],
      teacherAssignmentIds: [primaryAssignment.id],
      excludedTeacherAssignmentIds: [secondaryAssignment.id],
    });
    Object.assign(teacherContext(secondaryTeacher), {
      academicPeriodId: period.id,
      courseIds: [course.id],
      subjectIds: [language.id],
      teacherAssignmentIds: [secondaryAssignment.id],
      excludedTeacherAssignmentIds: [primaryAssignment.id],
    });
    for (const item of [primaryStudent, secondaryStudent]) {
      const student = students.get(item.key)!;
      Object.assign(studentContext(item), {
        academicPeriodId: period.id,
        courseId: course.id,
        enrollmentId: student.enrollmentId,
      });
    }
    config.metadata.lastVerifiedAt = new Date().toISOString();
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

    console.log(
      JSON.stringify({
        event: 'QA_SETUP_COMPLETE',
        environment: config.environment.name,
        institution: institutionCode,
        academicPeriod: periodName,
        accounts: config.accounts.map(({ key, role }) => ({ key, role })),
        teacherAssignments: [
          { accountKey: primaryTeacher.key, subjectCode: 'MATEMATICA' },
          { accountKey: secondaryTeacher.key, subjectCode: 'LENGUA_LIT' },
        ],
        enrollments: [primaryStudent.key, secondaryStudent.key],
        representativeLinks: representative.linkedStudentKeys ?? [],
      }),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'QA setup failed.');
  process.exit(1);
});
