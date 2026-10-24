/* eslint-disable @typescript-eslint/only-throw-error -- test setup intentionally fails fast with explicit Error instances when the database guard is not satisfied. */
import {
  AcademicPeriodStatus,
  AcademicRegime,
  PrismaClient,
  Role,
  ScheduleBlockKind,
  Weekday,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

export type ScheduleStructureFixture = {
  institutionId: string;
  academicPeriodId: string;
  userId: string;
  email: string;
  password: string;
  scheduleStructureId: string;
  cleanup: () => Promise<void>;
};

export type ScheduleStructureBrowserFixture = {
  institutionId: string;
  activeAcademicPeriodId: string;
  plannedAcademicPeriodId: string;
  closedAcademicPeriodId: string;
  archivedAcademicPeriodId: string;
  timetableId: string;
  admin: { email: string; password: string };
  teacher: { email: string; password: string };
  cleanup: () => Promise<void>;
};

/**
 * Refuses to create mutable fixtures unless the process is explicitly pointed
 * at the isolated local E2E database. Keep this guard at the reusable entry
 * point so future Playwright setup cannot accidentally target a shared DB.
 */
export async function assertIsolatedE2eDatabase(prisma: PrismaClient) {
  const url = process.env.DATABASE_URL ?? '';
  if (!/zerocademy_e2e/.test(url)) {
    throw new Error(
      'Schedule-structure E2E fixtures require DATABASE_URL for zerocademy_e2e.',
    );
  }

  const rows = await prisma.$queryRaw<Array<{ database: string }>>`
    SELECT current_database() AS database
  `;
  if (rows[0]?.database !== 'zerocademy_e2e') {
    throw new Error(
      'Schedule-structure E2E fixtures require the zerocademy_e2e database.',
    );
  }
}

/**
 * Creates the minimal institution-scoped schedule structure an authenticated
 * browser E2E test needs. The returned cleanup is idempotent and removes only
 * records created by this fixture.
 */
export async function createScheduleStructureE2eFixture(
  prisma: PrismaClient,
): Promise<ScheduleStructureFixture> {
  await assertIsolatedE2eDatabase(prisma);

  const suffix = `schedule-e2e-${randomUUID()}`;
  const password = 'ScheduleStructureE2e!123';
  const passwordHash = await bcrypt.hash(password, 10);
  const adminProfile = await prisma.permissionProfile.findUniqueOrThrow({
    where: { key: 'ADMIN_BASELINE' },
  });

  const fixture = await prisma.$transaction(async (tx) => {
    const institution = await tx.institution.create({
      data: {
        name: `Schedule fixture ${suffix}`,
        code: `SCHEDULE-FIXTURE-${suffix}`,
        regime: AcademicRegime.COSTA_GALAPAGOS,
      },
    });
    const academicPeriod = await tx.academicPeriod.create({
      data: {
        name: `Schedule fixture ${suffix}`,
        institutionId: institution.id,
        regime: AcademicRegime.COSTA_GALAPAGOS,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isActive: true,
        status: AcademicPeriodStatus.ACTIVE,
      },
    });
    await tx.institution.update({
      where: { id: institution.id },
      data: { activeAcademicPeriodId: academicPeriod.id },
    });
    const user = await tx.user.create({
      data: {
        email: `${suffix}@example.test`,
        passwordHash,
        firstName: 'Schedule',
        lastName: 'Fixture Admin',
        role: Role.ADMIN,
      },
    });
    await tx.institutionMembership.create({
      data: {
        institutionId: institution.id,
        userId: user.id,
        role: Role.ADMIN,
        permissionProfileId: adminProfile.id,
      },
    });
    const scheduleStructure = await tx.periodScheduleStructure.create({
      data: {
        institutionId: institution.id,
        academicPeriodId: academicPeriod.id,
        enabledWeekdays: [Weekday.MON, Weekday.TUE, Weekday.WED],
        scheduleBlocks: {
          create: [
            {
              position: 1,
              name: 'P1',
              startTime: new Date('1970-01-01T08:00:00.000Z'),
              endTime: new Date('1970-01-01T08:40:00.000Z'),
              kind: ScheduleBlockKind.TEACHING,
            },
            {
              position: 2,
              name: 'Break',
              startTime: new Date('1970-01-01T08:40:00.000Z'),
              endTime: new Date('1970-01-01T09:00:00.000Z'),
              kind: ScheduleBlockKind.BREAK,
            },
            {
              position: 3,
              name: 'P2',
              startTime: new Date('1970-01-01T09:00:00.000Z'),
              endTime: new Date('1970-01-01T09:40:00.000Z'),
              kind: ScheduleBlockKind.TEACHING,
            },
          ],
        },
      },
    });
    return { institution, academicPeriod, user, scheduleStructure };
  });

  return {
    institutionId: fixture.institution.id,
    academicPeriodId: fixture.academicPeriod.id,
    userId: fixture.user.id,
    email: fixture.user.email,
    password,
    scheduleStructureId: fixture.scheduleStructure.id,
    cleanup: async () => {
      await prisma.institution.deleteMany({
        where: { id: fixture.institution.id },
      });
      await prisma.user.deleteMany({ where: { id: fixture.user.id } });
    },
  };
}

/**
 * Creates a second institution for browser isolation coverage. Its active
 * context deliberately uses an existing *global* active period: the product
 * permits an institution to adopt that period, while the fixture never
 * mutates another institution's calendar. Closed and archived periods are
 * included only to demonstrate the current context-selector limitation.
 */
export async function createScheduleStructureBrowserFixture(
  prisma: PrismaClient,
): Promise<ScheduleStructureBrowserFixture> {
  await assertIsolatedE2eDatabase(prisma);

  // `Course.section` participates in a uniqueness key that does not include
  // the institution. A UUID makes the complete key collision-free across
  // retries, stale fixtures, and parallel processes.
  const suffix = `schedule-browser-e2e-${randomUUID()}`;
  const accountSuffix = randomUUID();
  const password = 'ScheduleBrowserE2e!123';
  const passwordHash = await bcrypt.hash(password, 10);
  const adminProfile = await prisma.permissionProfile.findUniqueOrThrow({
    where: { key: 'ADMIN_BASELINE' },
  });
  const globalActive = await prisma.academicPeriod.findFirst({
    where: {
      institutionId: null,
      status: AcademicPeriodStatus.ACTIVE,
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  if (!globalActive) {
    throw new Error(
      'Browser fixture requires an existing active global academic period.',
    );
  }
  const gradeLevel = await prisma.gradeLevel.findFirst({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });
  if (!gradeLevel) {
    throw new Error('Browser fixture requires an existing active grade level.');
  }

  const fixture = await prisma.$transaction(async (tx) => {
    const institution = await tx.institution.create({
      data: {
        name: `Browser fixture ${suffix}`,
        code: `BROWSER-FIXTURE-${suffix}`,
        regime: globalActive.regime,
        activeAcademicPeriodId: globalActive.id,
      },
    });
    const [plannedPeriod, closedPeriod, archivedPeriod] = await Promise.all([
      // The workspace requests page 1 only. Keep every synthetic lifecycle
      // period ahead of accumulated local fixture history in date ordering.
      tx.academicPeriod.create({
        data: {
          name: `Planned ${suffix}`,
          institutionId: institution.id,
          regime: globalActive.regime,
          startDate: new Date('2200-04-01'),
          endDate: new Date('2201-03-31'),
          status: AcademicPeriodStatus.PLANNED,
        },
      }),
      tx.academicPeriod.create({
        data: {
          name: `Closed ${suffix}`,
          institutionId: institution.id,
          regime: globalActive.regime,
          startDate: new Date('2199-04-01'),
          endDate: new Date('2200-03-31'),
          status: AcademicPeriodStatus.CLOSED,
        },
      }),
      tx.academicPeriod.create({
        data: {
          name: `Archived ${suffix}`,
          institutionId: institution.id,
          regime: globalActive.regime,
          startDate: new Date('2198-04-01'),
          endDate: new Date('2199-03-31'),
          status: AcademicPeriodStatus.ARCHIVED,
        },
      }),
    ]);
    // RFC-compatible local parts are required because the login DTO validates
    // fixture credentials through the production endpoint. `suffix` is too
    // long once a UUID and role label are combined for the TEACHER account.
    const admin = await tx.user.create({
      data: {
        email: `admin-${accountSuffix}@example.test`,
        passwordHash,
        firstName: 'Browser',
        lastName: 'Admin',
        role: Role.ADMIN,
      },
    });
    const teacher = await tx.user.create({
      data: {
        email: `teacher-${accountSuffix}@example.test`,
        passwordHash,
        firstName: 'Browser',
        lastName: 'Teacher',
        role: Role.TEACHER,
      },
    });
    await tx.institutionMembership.createMany({
      data: [
        {
          institutionId: institution.id,
          userId: admin.id,
          role: 'ADMIN',
          permissionProfileId: adminProfile.id,
        },
        { institutionId: institution.id, userId: teacher.id, role: 'TEACHER' },
      ],
    });
    const createStructure = (academicPeriodId: string, label: string) =>
      tx.periodScheduleStructure.create({
        data: {
          institutionId: institution.id,
          academicPeriodId,
          enabledWeekdays: [Weekday.MON, Weekday.TUE],
          scheduleBlocks: {
            create: [
              {
                position: 1,
                name: label,
                startTime: new Date('1970-01-01T08:00:00.000Z'),
                endTime: new Date('1970-01-01T08:40:00.000Z'),
                kind: ScheduleBlockKind.TEACHING,
              },
              {
                position: 2,
                name: `Recreo ${suffix}`,
                startTime: new Date('1970-01-01T08:40:00.000Z'),
                endTime: new Date('1970-01-01T09:00:00.000Z'),
                kind: ScheduleBlockKind.BREAK,
              },
              {
                position: 3,
                name: `No lectivo ${suffix}`,
                startTime: new Date('1970-01-01T09:00:00.000Z'),
                endTime: new Date('1970-01-01T09:20:00.000Z'),
                kind: ScheduleBlockKind.NON_TEACHING,
              },
            ],
          },
        },
        include: { scheduleBlocks: true },
      });
    const [activeStructure] = await Promise.all([
      createStructure(globalActive.id, `Activo ${suffix}`),
      createStructure(plannedPeriod.id, `Planificado ${suffix}`),
      createStructure(closedPeriod.id, `Cerrado ${suffix}`),
      createStructure(archivedPeriod.id, `Archivado ${suffix}`),
    ]);
    const teacherProfile = await tx.teacherProfile.create({
      data: { userId: teacher.id, institutionId: institution.id },
    });
    const subject = await tx.subject.create({
      data: {
        name: `Matemática ${suffix}`,
        code: `MATH-${suffix}`,
        institutionId: institution.id,
      },
    });
    const course = await tx.course.create({
      data: {
        name: `10.º E2E ${suffix}`,
        section: suffix,
        institutionId: institution.id,
        academicPeriodId: globalActive.id,
        gradeLevelId: gradeLevel.id,
      },
    });
    const assignment = await tx.teacherAssignment.create({
      data: {
        institutionId: institution.id,
        teacherId: teacherProfile.id,
        subjectId: subject.id,
        courseId: course.id,
        academicPeriodId: globalActive.id,
      },
    });
    const timetable = await tx.timetable.create({
      data: {
        institutionId: institution.id,
        academicPeriodId: globalActive.id,
        slots: {
          create: {
            teacherAssignmentId: assignment.id,
            scheduleBlockId: activeStructure.scheduleBlocks[0]!.id,
            dayOfWeek: Weekday.MON,
            teacherId: teacherProfile.id,
            courseId: course.id,
          },
        },
      },
    });
    return {
      institution,
      admin,
      teacher,
      plannedPeriod,
      closedPeriod,
      archivedPeriod,
      timetable,
    };
  });

  return {
    institutionId: fixture.institution.id,
    activeAcademicPeriodId: globalActive.id,
    plannedAcademicPeriodId: fixture.plannedPeriod.id,
    closedAcademicPeriodId: fixture.closedPeriod.id,
    archivedAcademicPeriodId: fixture.archivedPeriod.id,
    timetableId: fixture.timetable.id,
    admin: { email: fixture.admin.email, password },
    teacher: { email: fixture.teacher.email, password },
    cleanup: async () => {
      await prisma.institution.deleteMany({
        where: { id: fixture.institution.id },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [fixture.admin.id, fixture.teacher.id] } },
      });
    },
  };
}
