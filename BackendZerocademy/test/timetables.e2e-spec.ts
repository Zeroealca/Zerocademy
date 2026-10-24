/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/only-throw-error -- Supertest response bodies are intentionally untyped at the HTTP boundary. */
import { INestApplication } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicRegime,
  PrismaClient,
  Role,
  ScheduleBlockKind,
  TimetableStatus,
  Weekday,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import qaConfig from '../../qa/qa-users.local.json';
import { createTestApp } from './helpers/create-test-app';

type QaAccount = {
  key: string;
  email: string;
  password: string;
  institution: { id: string | null } | null;
  academicContext: {
    academicPeriodId?: string | null;
    teacherAssignmentIds?: string[];
  } | null;
};

const accounts = qaConfig.accounts as QaAccount[];
const account = (key: string) => {
  const item = accounts.find((candidate) => candidate.key === key);
  if (!item) throw new Error(`Missing QA account ${key}`);
  return item;
};

const admin = account('adminPrimary');
const teacher = account('teacherPrimary');
const secondaryTeacher = account('teacherSecondary');
const student = account('studentPrimary');
const representative = account('representativePrimary');
const superAdmin = account('superAdmin');
const institutionId = admin.institution?.id;
const academicPeriodId = teacher.academicContext?.academicPeriodId;

if (!institutionId || !academicPeriodId) {
  throw new Error('QA fixture IDs are missing; run npm run qa:setup first.');
}

describe('Timetables HTTP E2E', () => {
  let app: INestApplication<App>;
  const prisma = new PrismaClient();
  let adminToken: string;
  let institutionBId: string;
  let periodBId: string;
  let institutionBAdmin: QaAccount;
  let restrictedAdmin: QaAccount;
  let fixtureUserIds: string[] = [];
  let fixtureProfileId: string;
  let persistentFixtureCreated = false;
  const basePath = `/v1/institutions/${institutionId}/academic-periods/${academicPeriodId}/timetables`;

  const login = async (item: QaAccount): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: item.email, password: item.password });
    if (response.status !== 201)
      throw new Error(
        `Login failed for ${item.key}: ${JSON.stringify(response.body)}`,
      );
    return response.body.accessToken as string;
  };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const timetableSnapshot = async (timetableId: string) => {
    const timetable = await prisma.timetable.findUniqueOrThrow({
      where: { id: timetableId },
      include: {
        slots: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { scheduleBlockId: 'asc' },
            { teacherAssignmentId: 'asc' },
          ],
        },
      },
    });
    return {
      id: timetable.id,
      institutionId: timetable.institutionId,
      academicPeriodId: timetable.academicPeriodId,
      status: timetable.status,
      version: timetable.version,
      aggregateCount: await prisma.timetable.count({
        where: { institutionId, academicPeriodId },
      }),
      slots: timetable.slots.map((slot) => ({
        id: slot.id,
        teacherAssignmentId: slot.teacherAssignmentId,
        scheduleBlockId: slot.scheduleBlockId,
        dayOfWeek: slot.dayOfWeek,
        teacherId: slot.teacherId,
        courseId: slot.courseId,
      })),
    };
  };

  const responseConflicts = (response: request.Response) =>
    (response.body.message?.conflicts ??
      response.body.conflicts ??
      []) as Array<{
      code: string;
      teacherAssignmentIds: string[];
      courseIds: string[];
      weekday: string | null;
      scheduleBlockId: string | null;
      expectedWeeklyPeriods: number | null;
      actualWeeklyPeriods: number | null;
    }>;

  const clearTimetables = async () => {
    const rows = await prisma.timetable.findMany({
      where: { institutionId, academicPeriodId },
      select: { id: true },
    });
    await prisma.timetable.deleteMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });
  };

  const schedulingSnapshot = async (
    targetInstitutionId: string,
    targetAcademicPeriodId: string,
  ) => {
    const timetables = await prisma.timetable.findMany({
      where: {
        institutionId: targetInstitutionId,
        academicPeriodId: targetAcademicPeriodId,
      },
      include: {
        slots: {
          orderBy: [
            { dayOfWeek: 'asc' },
            { scheduleBlockId: 'asc' },
            { teacherAssignmentId: 'asc' },
          ],
        },
      },
      orderBy: { id: 'asc' },
    });
    return timetables.map((timetable) => ({
      id: timetable.id,
      institutionId: timetable.institutionId,
      academicPeriodId: timetable.academicPeriodId,
      version: timetable.version,
      status: timetable.status,
      slots: timetable.slots.map((slot) => ({
        id: slot.id,
        teacherAssignmentId: slot.teacherAssignmentId,
        scheduleBlockId: slot.scheduleBlockId,
        dayOfWeek: slot.dayOfWeek,
        teacherId: slot.teacherId,
        courseId: slot.courseId,
      })),
    }));
  };

  const normalizedProposalSlots = (
    slots: Array<{
      teacherAssignmentId: string;
      weekday: string;
      scheduleBlockId: string;
    }>,
  ) =>
    slots
      .map((slot) => ({
        teacherAssignmentId: slot.teacherAssignmentId,
        weekday: slot.weekday,
        scheduleBlockId: slot.scheduleBlockId,
      }))
      .sort(
        (left, right) =>
          left.teacherAssignmentId.localeCompare(right.teacherAssignmentId) ||
          left.weekday.localeCompare(right.weekday) ||
          left.scheduleBlockId.localeCompare(right.scheduleBlockId),
      );

  const createGenerationFixture = async (kind: 'realistic' | 'no-teaching') => {
    const suffix = `generation-e2e-${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const sourceAssignments = await prisma.teacherAssignment.findMany({
      where: { institutionId, academicPeriodId },
      include: { course: true },
      orderBy: { id: 'asc' },
    });
    const sourceAssignment = sourceAssignments[0];
    const secondSourceAssignment = sourceAssignments.find(
      (assignment) => assignment.teacherId !== sourceAssignment?.teacherId,
    );
    if (!sourceAssignment || !secondSourceAssignment) {
      throw new Error('Timetable E2E requires two QA teacher assignments.');
    }
    const password = 'TimetableGenerationE2e!123';
    const passwordHash = await bcrypt.hash(password, 10);
    const adminProfile = await prisma.permissionProfile.findUniqueOrThrow({
      where: { key: 'ADMIN_BASELINE' },
    });
    const fixture = await prisma.$transaction(async (tx) => {
      const targetInstitution = await tx.institution.create({
        data: {
          name: `Timetable generation ${kind} ${suffix}`,
          code: `TIMETABLE-GEN-${suffix}`,
          regime: AcademicRegime.COSTA_GALAPAGOS,
        },
      });
      const targetPeriod = await tx.academicPeriod.create({
        data: {
          name: `Timetable generation ${kind} ${suffix}`,
          institutionId: targetInstitution.id,
          regime: AcademicRegime.COSTA_GALAPAGOS,
          startDate: new Date('2026-04-01'),
          endDate: new Date('2027-03-31'),
          isActive: true,
          status: AcademicPeriodStatus.ACTIVE,
        },
      });
      await tx.institution.update({
        where: { id: targetInstitution.id },
        data: { activeAcademicPeriodId: targetPeriod.id },
      });
      const user = await tx.user.create({
        data: {
          email: `tg-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
          passwordHash,
          firstName: 'Generation',
          lastName: 'Administrator',
          role: Role.ADMIN,
        },
      });
      await tx.institutionMembership.create({
        data: {
          institutionId: targetInstitution.id,
          userId: user.id,
          role: 'ADMIN',
          permissionProfileId: adminProfile.id,
        },
      });
      const structure = await tx.periodScheduleStructure.create({
        data: {
          institutionId: targetInstitution.id,
          academicPeriodId: targetPeriod.id,
          enabledWeekdays: [Weekday.MON, Weekday.TUE, Weekday.WED],
        },
      });
      const blocks = await tx.scheduleBlock.createManyAndReturn({
        data:
          kind === 'realistic'
            ? [
                {
                  periodScheduleStructureId: structure.id,
                  position: 1,
                  name: 'P1',
                  startTime: new Date('1970-01-01T08:00:00.000Z'),
                  endTime: new Date('1970-01-01T08:40:00.000Z'),
                  kind: ScheduleBlockKind.TEACHING,
                },
                {
                  periodScheduleStructureId: structure.id,
                  position: 2,
                  name: 'Break',
                  startTime: new Date('1970-01-01T08:40:00.000Z'),
                  endTime: new Date('1970-01-01T09:00:00.000Z'),
                  kind: ScheduleBlockKind.BREAK,
                },
                {
                  periodScheduleStructureId: structure.id,
                  position: 3,
                  name: 'P2',
                  startTime: new Date('1970-01-01T09:00:00.000Z'),
                  endTime: new Date('1970-01-01T09:40:00.000Z'),
                  kind: ScheduleBlockKind.TEACHING,
                },
                {
                  periodScheduleStructureId: structure.id,
                  position: 4,
                  name: 'Admin',
                  startTime: new Date('1970-01-01T09:40:00.000Z'),
                  endTime: new Date('1970-01-01T10:00:00.000Z'),
                  kind: ScheduleBlockKind.NON_TEACHING,
                },
                {
                  periodScheduleStructureId: structure.id,
                  position: 5,
                  name: 'P3',
                  startTime: new Date('1970-01-01T10:00:00.000Z'),
                  endTime: new Date('1970-01-01T10:40:00.000Z'),
                  kind: ScheduleBlockKind.TEACHING,
                },
              ]
            : [
                {
                  periodScheduleStructureId: structure.id,
                  position: 1,
                  name: 'Break only',
                  startTime: new Date('1970-01-01T08:00:00.000Z'),
                  endTime: new Date('1970-01-01T08:20:00.000Z'),
                  kind: ScheduleBlockKind.BREAK,
                },
              ],
      });
      if (kind !== 'realistic')
        return {
          targetInstitution,
          targetPeriod,
          user,
          blocks,
          assignments: [],
        };
      const courses = await Promise.all(
        ['A', 'B', 'C'].map((section) =>
          tx.course.create({
            data: {
              name: `Generation course ${section} ${suffix}`,
              section: `GEN-${section}-${suffix}`,
              institutionId: targetInstitution.id,
              academicPeriodId: targetPeriod.id,
              gradeLevelId: sourceAssignment.course.gradeLevelId,
              subLevelId: sourceAssignment.course.subLevelId,
            },
          }),
        ),
      );
      const subjects = await Promise.all(
        ['Mathematics', 'Language', 'Science', 'History'].map((name, index) =>
          tx.subject.create({
            data: {
              name: `${name} ${suffix}`,
              code: `GEN-${index}-${suffix}`,
              institutionId: targetInstitution.id,
            },
          }),
        ),
      );
      const assignments = await Promise.all(
        [
          [sourceAssignment.teacherId, courses[0].id, subjects[0].id, 2],
          [sourceAssignment.teacherId, courses[1].id, subjects[1].id, 2],
          [secondSourceAssignment.teacherId, courses[1].id, subjects[2].id, 2],
          [secondSourceAssignment.teacherId, courses[2].id, subjects[3].id, 2],
        ].map(([teacherId, courseId, subjectId, weeklyPeriods]) =>
          tx.teacherAssignment.create({
            data: {
              institutionId: targetInstitution.id,
              academicPeriodId: targetPeriod.id,
              teacherId: teacherId as string,
              courseId: courseId as string,
              subjectId: subjectId as string,
              teachingLoad: {
                create: { weeklyPeriods: weeklyPeriods as number },
              },
            },
            include: { teachingLoad: true },
          }),
        ),
      );
      return { targetInstitution, targetPeriod, user, blocks, assignments };
    });
    return {
      ...fixture,
      password,
      cleanup: async () => {
        await prisma.institution.delete({
          where: { id: fixture.targetInstitution.id },
        });
        await prisma.user.delete({ where: { id: fixture.user.id } });
      },
    };
  };

  beforeAll(async () => {
    const url = process.env.DATABASE_URL ?? '';
    if (!/zerocademy_e2e/.test(url)) {
      throw new Error(
        'Timetable E2E requires DATABASE_URL for zerocademy_e2e.',
      );
    }
    const database = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT current_database() AS database
    `;
    if (database[0]?.database !== 'zerocademy_e2e') {
      throw new Error('Timetable E2E requires the zerocademy_e2e database.');
    }
    app = await createTestApp();
    adminToken = await login(admin);
    await clearTimetables();
    const suffix = `e2e-${Date.now()}`;
    const passwordHash = await bcrypt.hash('TimetableE2e!123', 10);
    const adminProfile = await prisma.permissionProfile.findUniqueOrThrow({
      where: { key: 'ADMIN_BASELINE' },
    });
    const institutionB = await prisma.institution.create({
      data: {
        name: `Timetable E2E Institution B ${suffix}`,
        code: `TIMETABLE-E2E-B-${suffix}`,
        regime: AcademicRegime.COSTA_GALAPAGOS,
      },
    });
    institutionBId = institutionB.id;
    persistentFixtureCreated = true;
    const periodB = await prisma.academicPeriod.create({
      data: {
        name: `Timetable E2E Period B ${suffix}`,
        institutionId: institutionBId,
        regime: AcademicRegime.COSTA_GALAPAGOS,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2027-03-31'),
        isActive: true,
        status: AcademicPeriodStatus.ACTIVE,
      },
    });
    periodBId = periodB.id;
    await prisma.institution.update({
      where: { id: institutionBId },
      data: { activeAcademicPeriodId: periodBId },
    });
    const [bUser, restrictedUser, profile] = await prisma.$transaction(
      async (tx) => {
        const b = await tx.user.create({
          data: {
            email: `timetable-b-${suffix}@example.test`,
            passwordHash,
            firstName: 'Institution',
            lastName: 'B',
            role: Role.ADMIN,
          },
        });
        const restricted = await tx.user.create({
          data: {
            email: `timetable-restricted-${suffix}@example.test`,
            passwordHash,
            firstName: 'Restricted',
            lastName: 'Admin',
            role: Role.ADMIN,
          },
        });
        const permissionProfile = await tx.permissionProfile.create({
          data: {
            key: `TIMETABLE_E2E_EMPTY_${suffix}`,
            name: 'Timetable E2E empty',
            role: Role.ADMIN,
            isSystem: false,
          },
        });
        await tx.institutionMembership.createMany({
          data: [
            {
              institutionId: institutionBId,
              userId: b.id,
              role: 'ADMIN',
              permissionProfileId: adminProfile.id,
            },
            {
              institutionId,
              userId: restricted.id,
              role: 'ADMIN',
              permissionProfileId: permissionProfile.id,
            },
          ],
        });
        return [b, restricted, permissionProfile];
      },
    );
    fixtureUserIds = [bUser.id, restrictedUser.id];
    fixtureProfileId = profile.id;
    institutionBAdmin = {
      key: 'institutionBAdmin',
      email: bUser.email,
      password: 'TimetableE2e!123',
      institution: { id: institutionBId },
      academicContext: { academicPeriodId: periodBId },
    };
    restrictedAdmin = {
      key: 'restrictedAdmin',
      email: restrictedUser.email,
      password: 'TimetableE2e!123',
      institution: { id: institutionId },
      academicContext: { academicPeriodId },
    };
    const structurePath = `/v1/institutions/${institutionId}/academic-periods/${academicPeriodId}/schedule-structure`;
    await request(app.getHttpServer())
      .put(structurePath)
      .set(auth(adminToken))
      .send({ enabledWeekdays: ['MON', 'TUE'] })
      .expect(200);
    const structure = await request(app.getHttpServer())
      .get(structurePath)
      .set(auth(adminToken))
      .expect(200);
    if (structure.body.blocks.length === 0) {
      for (const block of [
        {
          name: 'E2E P1',
          startTime: '08:00',
          endTime: '08:40',
          kind: 'TEACHING',
        },
        {
          name: 'E2E P2',
          startTime: '08:50',
          endTime: '09:30',
          kind: 'TEACHING',
        },
      ]) {
        await request(app.getHttpServer())
          .post(`${structurePath}/blocks`)
          .set(auth(adminToken))
          .send(block)
          .expect(201);
      }
    }
    for (const assignmentId of [
      ...(teacher.academicContext?.teacherAssignmentIds ?? []),
      ...(secondaryTeacher.academicContext?.teacherAssignmentIds ?? []),
    ]) {
      await request(app.getHttpServer())
        .put(`/v1/teacher-assignments/${assignmentId}/teaching-load`)
        .set(auth(adminToken))
        .send({ weeklyPeriods: 2 })
        .expect(200);
    }
  }, 30_000);

  afterAll(async () => {
    if (!persistentFixtureCreated) {
      await app?.close();
      await prisma.$disconnect();
      return;
    }
    await clearTimetables();
    await prisma.institution.deleteMany({ where: { id: institutionBId } });
    await prisma.user.deleteMany({ where: { id: { in: fixtureUserIds } } });
    await prisma.permissionProfile.deleteMany({
      where: { id: fixtureProfileId },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('rejects non-institutional timetable callers and keeps the database unchanged', async () => {
    const [teacherToken, studentToken, representativeToken, superAdminToken] =
      await Promise.all([
        login(teacher),
        login(student),
        login(representative),
        login(superAdmin),
      ]);
    const before = await prisma.timetable.count({
      where: { institutionId, academicPeriodId },
    });

    await request(app.getHttpServer()).get(basePath).expect(401);
    for (const token of [
      teacherToken,
      studentToken,
      representativeToken,
      superAdminToken,
    ]) {
      await request(app.getHttpServer())
        .get(basePath)
        .set(auth(token))
        .expect(403);
    }
    await request(app.getHttpServer())
      .post(basePath)
      .set(auth(studentToken))
      .send({ slots: [] })
      .expect(403);

    expect(
      await prisma.timetable.count({
        where: { institutionId, academicPeriodId },
      }),
    ).toBe(before);
  });

  it('supports concurrent valid logins without duplicate refresh-token failures', async () => {
    const responses = await Promise.all(
      [admin, teacher, student, representative, superAdmin].map((item) =>
        request(app.getHttpServer())
          .post('/v1/auth/login')
          .send({ email: item.email, password: item.password }),
      ),
    );
    expect(responses.every((response) => response.status === 201)).toBe(true);
    expect(
      responses.every(
        (response) => typeof response.body.accessToken === 'string',
      ),
    ).toBe(true);
  });

  it('denies an Institution B ADMIN every Institution A collection mutation', async () => {
    const token = await login(institutionBAdmin);
    const before = await prisma.timetable.count({
      where: { institutionId, academicPeriodId },
    });
    await request(app.getHttpServer())
      .get(basePath)
      .set(auth(token))
      .expect(404);
    await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(token))
      .send({})
      .expect(404);
    await request(app.getHttpServer())
      .post(basePath)
      .set(auth(token))
      .send({ slots: [] })
      .expect(404);
    expect(
      await prisma.timetable.count({
        where: { institutionId, academicPeriodId },
      }),
    ).toBe(before);
  });

  it('hides Institution A detail routes from Institution B and preserves its draft', async () => {
    const generated = await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(adminToken))
      .send({ maxSearchNodes: 10_000 })
      .expect(201);
    const created = await request(app.getHttpServer())
      .post(basePath)
      .set(auth(adminToken))
      .send({ slots: generated.body.slots })
      .expect(201);
    const timetableId = created.body.id as string;
    const detailPath = `/v1/timetables/${timetableId}`;
    const validationPath = `${detailPath}/validation`;
    const slotsPath = `${detailPath}/slots`;
    const replacement = {
      expectedVersion: created.body.version,
      slots: generated.body.slots.slice(0, 1),
    };
    const institutionBToken = await login(institutionBAdmin);

    await request(app.getHttpServer())
      .get(detailPath)
      .set(auth(adminToken))
      .expect(200);
    await request(app.getHttpServer())
      .get(validationPath)
      .set(auth(adminToken))
      .expect(200);

    await request(app.getHttpServer())
      .get(detailPath)
      .set(auth(institutionBToken))
      .expect(404);
    await request(app.getHttpServer())
      .get(validationPath)
      .set(auth(institutionBToken))
      .expect(404);

    const beforeDeniedReplace = await timetableSnapshot(timetableId);
    await request(app.getHttpServer())
      .put(slotsPath)
      .set(auth(institutionBToken))
      .send(replacement)
      .expect(404);
    expect(await timetableSnapshot(timetableId)).toEqual(beforeDeniedReplace);

    const beforeDeniedDelete = await timetableSnapshot(timetableId);
    await request(app.getHttpServer())
      .delete(detailPath)
      .set(auth(institutionBToken))
      .expect(404);
    expect(await timetableSnapshot(timetableId)).toEqual(beforeDeniedDelete);

    await request(app.getHttpServer())
      .put(slotsPath)
      .set(auth(adminToken))
      .send(replacement)
      .expect(200);
    await request(app.getHttpServer())
      .delete(detailPath)
      .set(auth(adminToken))
      .expect(204);
  });

  it('enforces read, generate, and update capabilities for a restricted ADMIN membership', async () => {
    const token = await login(restrictedAdmin);
    const before = await prisma.timetable.count({
      where: { institutionId, academicPeriodId },
    });
    await request(app.getHttpServer())
      .get(basePath)
      .set(auth(token))
      .expect(403);
    await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(token))
      .send({})
      .expect(403);
    await request(app.getHttpServer())
      .post(basePath)
      .set(auth(token))
      .send({ slots: [] })
      .expect(403);
    expect(
      await prisma.timetable.count({
        where: { institutionId, academicPeriodId },
      }),
    ).toBe(before);
  });

  it('generates a public proposal, persists it directly, versions draft replacement, and deletes it', async () => {
    const generated = await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(adminToken))
      .send({ maxSearchNodes: 10_000 })
      .expect(201);

    expect(generated.body.status).toBe('SUCCESS');
    expect(generated.body.slots.length).toBeGreaterThan(0);
    expect(generated.body.slots[0]).not.toHaveProperty('id');

    const created = await request(app.getHttpServer())
      .post(basePath)
      .set(auth(adminToken))
      .send({ slots: generated.body.slots })
      .expect(201);
    const timetableId = created.body.id as string;
    expect(created.body.version).toBe(1);

    await request(app.getHttpServer())
      .get(`/v1/timetables/${timetableId}`)
      .set(auth(adminToken))
      .expect(200);
    const replacement = await request(app.getHttpServer())
      .put(`/v1/timetables/${timetableId}/slots`)
      .set(auth(adminToken))
      .send({ expectedVersion: 1, slots: generated.body.slots.slice(0, 1) })
      .expect(200);
    expect(replacement.body.version).toBe(2);

    await request(app.getHttpServer())
      .put(`/v1/timetables/${timetableId}/slots`)
      .set(auth(adminToken))
      .send({ expectedVersion: 1, slots: generated.body.slots.slice(0, 1) })
      .expect(409);
    await request(app.getHttpServer())
      .delete(`/v1/timetables/${timetableId}`)
      .set(auth(adminToken))
      .expect(204);
    await request(app.getHttpServer())
      .get(`/v1/timetables/${timetableId}`)
      .set(auth(adminToken))
      .expect(404);
  });

  it('publishes only a current, complete draft and safely returns it to draft', async () => {
    const generated = await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(adminToken))
      .send({ maxSearchNodes: 10_000 })
      .expect(200);
    const created = await request(app.getHttpServer())
      .post(basePath)
      .set(auth(adminToken))
      .send({ slots: generated.body.slots })
      .expect(201);
    const timetableId = created.body.id as string;

    const published = await request(app.getHttpServer())
      .post(`/v1/timetables/${timetableId}/publish`)
      .set(auth(adminToken))
      .send({ expectedVersion: created.body.version })
      .expect(200);
    expect(published.body).toMatchObject({
      status: TimetableStatus.PUBLISHED,
      version: created.body.version + 1,
      publishedByUserId: expect.any(String),
      publishedAt: expect.any(String),
    });

    await request(app.getHttpServer())
      .put(`/v1/timetables/${timetableId}/slots`)
      .set(auth(adminToken))
      .send({
        expectedVersion: published.body.version,
        slots: generated.body.slots,
      })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/v1/timetables/${timetableId}/publish`)
      .set(auth(adminToken))
      .send({ expectedVersion: published.body.version })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/v1/timetables/${timetableId}/unpublish`)
      .set(auth(adminToken))
      .send({ expectedVersion: created.body.version })
      .expect(409);

    const unpublished = await request(app.getHttpServer())
      .post(`/v1/timetables/${timetableId}/unpublish`)
      .set(auth(adminToken))
      .send({ expectedVersion: published.body.version })
      .expect(200);
    expect(unpublished.body).toMatchObject({
      status: TimetableStatus.DRAFT,
      version: published.body.version + 1,
      publishedAt: null,
      publishedByUserId: null,
    });
    await request(app.getHttpServer())
      .delete(`/v1/timetables/${timetableId}`)
      .set(auth(adminToken))
      .expect(204);
  });

  it('rolls back a create containing an unknown schedule block', async () => {
    const generated = await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(adminToken))
      .send({ maxSearchNodes: 10_000 })
      .expect(201);
    const before = await prisma.timetable.count({
      where: { institutionId, academicPeriodId },
    });

    await request(app.getHttpServer())
      .post(basePath)
      .set(auth(adminToken))
      .send({
        slots: [
          generated.body.slots[0],
          {
            ...generated.body.slots[1],
            scheduleBlockId: '00000000-0000-4000-8000-000000000000',
          },
        ],
      })
      .expect(400);

    expect(
      await prisma.timetable.count({
        where: { institutionId, academicPeriodId },
      }),
    ).toBe(before);
  });

  it('allows at most one simultaneous replacement for the same draft version', async () => {
    const generated = await request(app.getHttpServer())
      .post(`${basePath}/generate`)
      .set(auth(adminToken))
      .send({ maxSearchNodes: 10_000 })
      .expect(201);
    const created = await request(app.getHttpServer())
      .post(basePath)
      .set(auth(adminToken))
      .send({ slots: generated.body.slots })
      .expect(201);
    const path = `/v1/timetables/${created.body.id}/slots`;
    const payload = {
      expectedVersion: 1,
      slots: generated.body.slots.slice(0, 1),
    };
    const responses = await Promise.all([
      request(app.getHttpServer())
        .put(path)
        .set(auth(adminToken))
        .send(payload),
      request(app.getHttpServer())
        .put(path)
        .set(auth(adminToken))
        .send(payload),
    ]);

    expect(responses.map((response) => response.status).sort()).toEqual([
      200, 409,
    ]);
    expect(
      (
        await prisma.timetable.findUniqueOrThrow({
          where: { id: created.body.id },
        })
      ).version,
    ).toBe(2);
  });

  describe('realistic deterministic generation', () => {
    it('generates a stable, read-only multi-course proposal that creates a COMPLETE draft', async () => {
      const fixture = await createGenerationFixture('realistic');
      try {
        const token = await login({
          key: 'generationAdmin',
          email: fixture.user.email,
          password: fixture.password,
          institution: { id: fixture.targetInstitution.id },
          academicContext: { academicPeriodId: fixture.targetPeriod.id },
        });
        const fixturePath = `/v1/institutions/${fixture.targetInstitution.id}/academic-periods/${fixture.targetPeriod.id}/timetables`;
        const before = await schedulingSnapshot(
          fixture.targetInstitution.id,
          fixture.targetPeriod.id,
        );

        const first = await request(app.getHttpServer())
          .post(`${fixturePath}/generate`)
          .set(auth(token))
          .send({ maxSearchNodes: 10_000 })
          .expect(201);
        const second = await request(app.getHttpServer())
          .post(`${fixturePath}/generate`)
          .set(auth(token))
          .send({ maxSearchNodes: 10_000 })
          .expect(201);

        expect(first.body.status).toBe('SUCCESS');
        expect(second.body.status).toBe('SUCCESS');
        expect(second.body.slots).toEqual(first.body.slots);
        expect(normalizedProposalSlots(second.body.slots)).toEqual(
          normalizedProposalSlots(first.body.slots),
        );
        expect(second.body.statistics.generatedSlots).toBe(8);
        expect(first.body.slots).toHaveLength(8);
        expect(first.body.statistics).toMatchObject({
          requirements: 8,
          generatedSlots: 8,
          searchNodesExplored: expect.any(Number),
          backtracks: expect.any(Number),
        });

        const assignments = new Map(
          fixture.assignments.map((assignment) => [assignment.id, assignment]),
        );
        const teachingBlockIds = new Set(
          fixture.blocks
            .filter((block) => block.kind === ScheduleBlockKind.TEACHING)
            .map((block) => block.id),
        );
        const expectedLoads = new Map(
          fixture.assignments.map((assignment) => [
            assignment.id,
            assignment.teachingLoad?.weeklyPeriods,
          ]),
        );
        const loadCounts = new Map<string, number>();
        const teacherCells = new Set<string>();
        const courseCells = new Set<string>();
        for (const slot of first.body.slots) {
          const assignment = assignments.get(slot.teacherAssignmentId);
          if (!assignment) {
            throw new Error(
              `Generated slot references unknown assignment ${slot.teacherAssignmentId}`,
            );
          }
          expect([Weekday.MON, Weekday.TUE, Weekday.WED]).toContain(
            slot.weekday,
          );
          expect(teachingBlockIds.has(slot.scheduleBlockId)).toBe(true);
          const cell = `${slot.weekday}|${slot.scheduleBlockId}`;
          expect(teacherCells.has(`${assignment.teacherId}|${cell}`)).toBe(
            false,
          );
          expect(courseCells.has(`${assignment.courseId}|${cell}`)).toBe(false);
          teacherCells.add(`${assignment.teacherId}|${cell}`);
          courseCells.add(`${assignment.courseId}|${cell}`);
          loadCounts.set(
            slot.teacherAssignmentId,
            (loadCounts.get(slot.teacherAssignmentId) ?? 0) + 1,
          );
        }
        expect([...loadCounts.entries()].sort()).toEqual(
          [...expectedLoads.entries()].sort(),
        );
        expect(
          await schedulingSnapshot(
            fixture.targetInstitution.id,
            fixture.targetPeriod.id,
          ),
        ).toEqual(before);

        const created = await request(app.getHttpServer())
          .post(fixturePath)
          .set(auth(token))
          .send({ slots: first.body.slots })
          .expect(201);
        const persisted = await request(app.getHttpServer())
          .get(`/v1/timetables/${created.body.id}`)
          .set(auth(token))
          .expect(200);
        expect(normalizedProposalSlots(persisted.body.slots)).toEqual(
          normalizedProposalSlots(first.body.slots),
        );
        const validation = await request(app.getHttpServer())
          .get(`/v1/timetables/${created.body.id}/validation`)
          .set(auth(token))
          .expect(200);
        expect(validation.body).toMatchObject({
          valid: true,
          mode: 'COMPLETE',
        });
      } finally {
        await fixture.cleanup();
      }
    });

    it('maps an unusable persisted structure to HTTP 400 without timetable writes', async () => {
      const fixture = await createGenerationFixture('no-teaching');
      try {
        const token = await login({
          key: 'invalidGenerationAdmin',
          email: fixture.user.email,
          password: fixture.password,
          institution: { id: fixture.targetInstitution.id },
          academicContext: { academicPeriodId: fixture.targetPeriod.id },
        });
        const before = await schedulingSnapshot(
          fixture.targetInstitution.id,
          fixture.targetPeriod.id,
        );
        const response = await request(app.getHttpServer())
          .post(
            `/v1/institutions/${fixture.targetInstitution.id}/academic-periods/${fixture.targetPeriod.id}/timetables/generate`,
          )
          .set(auth(token))
          .send({})
          .expect(400);
        expect(response.body.message).toBe(
          'Schedule structure is not ready for timetable operations',
        );
        expect(
          await schedulingSnapshot(
            fixture.targetInstitution.id,
            fixture.targetPeriod.id,
          ),
        ).toEqual(before);
      } finally {
        await fixture.cleanup();
      }
    });

    it('returns SEARCH_LIMIT_REACHED through HTTP without persisting a partial proposal', async () => {
      const fixture = await createGenerationFixture('realistic');
      try {
        const token = await login({
          key: 'searchLimitGenerationAdmin',
          email: fixture.user.email,
          password: fixture.password,
          institution: { id: fixture.targetInstitution.id },
          academicContext: { academicPeriodId: fixture.targetPeriod.id },
        });
        const before = await schedulingSnapshot(
          fixture.targetInstitution.id,
          fixture.targetPeriod.id,
        );
        const response = await request(app.getHttpServer())
          .post(
            `/v1/institutions/${fixture.targetInstitution.id}/academic-periods/${fixture.targetPeriod.id}/timetables/generate`,
          )
          .set(auth(token))
          .send({ maxSearchNodes: 1 })
          .expect(201);
        expect(response.body).toMatchObject({
          status: 'SEARCH_LIMIT_REACHED',
          slots: [],
          diagnostics: [
            expect.objectContaining({ code: 'SEARCH_NODE_LIMIT_REACHED' }),
          ],
        });
        expect(
          await schedulingSnapshot(
            fixture.targetInstitution.id,
            fixture.targetPeriod.id,
          ),
        ).toEqual(before);
      } finally {
        await fixture.cleanup();
      }
    });
  });

  describe('academic-period and publication lifecycle', () => {
    const periodWriteBlockedMessage =
      'Timetables cannot change a closed or archived academic period';

    const fixtureAccount = (
      fixture: Awaited<ReturnType<typeof createGenerationFixture>>,
    ) => ({
      key: 'lifecycleFixtureAdmin',
      email: fixture.user.email,
      password: fixture.password,
      institution: { id: fixture.targetInstitution.id },
      academicContext: { academicPeriodId: fixture.targetPeriod.id },
    });

    const createDraft = async (
      fixture: Awaited<ReturnType<typeof createGenerationFixture>>,
      token: string,
    ) => {
      const fixturePath = `/v1/institutions/${fixture.targetInstitution.id}/academic-periods/${fixture.targetPeriod.id}/timetables`;
      const proposal = await request(app.getHttpServer())
        .post(`${fixturePath}/generate`)
        .set(auth(token))
        .send({ maxSearchNodes: 10_000 })
        .expect(201);
      const created = await request(app.getHttpServer())
        .post(fixturePath)
        .set(auth(token))
        .send({ slots: proposal.body.slots })
        .expect(201);
      return {
        fixturePath,
        proposalSlots: proposal.body.slots,
        timetableId: created.body.id as string,
      };
    };

    const expectReadable = async (
      fixturePath: string,
      timetableId: string,
      token: string,
    ) => {
      const list = await request(app.getHttpServer())
        .get(fixturePath)
        .set(auth(token))
        .expect(200);
      expect(list.body.data).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: timetableId })]),
      );
      await request(app.getHttpServer())
        .get(`/v1/timetables/${timetableId}`)
        .set(auth(token))
        .expect(200);
      await request(app.getHttpServer())
        .get(`/v1/timetables/${timetableId}/validation`)
        .set(auth(token))
        .expect(200);
    };

    const expectPeriodWriteBlocked = async (
      fixture: Awaited<ReturnType<typeof createGenerationFixture>>,
      token: string,
      fixturePath: string,
      timetableId: string,
      proposalSlots: unknown,
    ) => {
      const reject = async (call: () => request.Test) => {
        const before = await schedulingSnapshot(
          fixture.targetInstitution.id,
          fixture.targetPeriod.id,
        );
        const response = await call();
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({
          statusCode: 400,
          error: 'Bad Request',
          message: periodWriteBlockedMessage,
        });
        expect(response.body.stack).toBeUndefined();
        expect(
          await schedulingSnapshot(
            fixture.targetInstitution.id,
            fixture.targetPeriod.id,
          ),
        ).toEqual(before);
      };

      await reject(() =>
        request(app.getHttpServer())
          .post(`${fixturePath}/generate`)
          .set(auth(token))
          .send({}),
      );
      await reject(() =>
        request(app.getHttpServer())
          .post(fixturePath)
          .set(auth(token))
          .send({ slots: proposalSlots }),
      );
      await reject(() =>
        request(app.getHttpServer())
          .put(`/v1/timetables/${timetableId}/slots`)
          .set(auth(token))
          .send({ expectedVersion: 1, slots: proposalSlots }),
      );
      await reject(() =>
        request(app.getHttpServer())
          .delete(`/v1/timetables/${timetableId}`)
          .set(auth(token)),
      );
    };

    it('keeps CLOSED-period timetables readable and rejects every write without a partial change', async () => {
      const fixture = await createGenerationFixture('realistic');
      try {
        const [token, superAdminToken] = await Promise.all([
          login(fixtureAccount(fixture)),
          login(superAdmin),
        ]);
        const { fixturePath, proposalSlots, timetableId } = await createDraft(
          fixture,
          token,
        );
        const closed = await request(app.getHttpServer())
          .post(`/v1/academic-periods/${fixture.targetPeriod.id}/deactivate`)
          .set(auth(superAdminToken))
          .expect(201);
        expect(closed.body).toMatchObject({
          id: fixture.targetPeriod.id,
          status: AcademicPeriodStatus.CLOSED,
          isActive: false,
        });
        await expectReadable(fixturePath, timetableId, token);
        await expectPeriodWriteBlocked(
          fixture,
          token,
          fixturePath,
          timetableId,
          proposalSlots,
        );
      } finally {
        await fixture.cleanup();
      }
    });

    it('keeps ARCHIVED-period timetables readable and rejects every write without a partial change', async () => {
      const fixture = await createGenerationFixture('realistic');
      try {
        const [token, superAdminToken] = await Promise.all([
          login(fixtureAccount(fixture)),
          login(superAdmin),
        ]);
        const { fixturePath, proposalSlots, timetableId } = await createDraft(
          fixture,
          token,
        );
        await request(app.getHttpServer())
          .post(`/v1/academic-periods/${fixture.targetPeriod.id}/deactivate`)
          .set(auth(superAdminToken))
          .expect(201);
        const archived = await request(app.getHttpServer())
          .post(`/v1/academic-periods/${fixture.targetPeriod.id}/archive`)
          .set(auth(superAdminToken))
          .expect(201);
        expect(archived.body).toMatchObject({
          id: fixture.targetPeriod.id,
          status: AcademicPeriodStatus.ARCHIVED,
          isActive: false,
        });
        await expectReadable(fixturePath, timetableId, token);
        await expectPeriodWriteBlocked(
          fixture,
          token,
          fixturePath,
          timetableId,
          proposalSlots,
        );
      } finally {
        await fixture.cleanup();
      }
    });

    it('keeps a PUBLISHED timetable readable and immutable before stale-version evaluation', async () => {
      const fixture = await createGenerationFixture('realistic');
      try {
        const token = await login(fixtureAccount(fixture));
        const { fixturePath, proposalSlots, timetableId } = await createDraft(
          fixture,
          token,
        );
        await prisma.timetable.update({
          where: { id: timetableId },
          data: {
            status: TimetableStatus.PUBLISHED,
            publishedAt: new Date(),
            publishedByUserId: fixture.user.id,
          },
        });
        await expectReadable(fixturePath, timetableId, token);

        const rejectPublished = async (
          call: () => request.Test,
          message: string,
        ) => {
          const before = await schedulingSnapshot(
            fixture.targetInstitution.id,
            fixture.targetPeriod.id,
          );
          const response = await call();
          expect(response.status).toBe(409);
          expect(response.body).toMatchObject({
            statusCode: 409,
            error: 'Conflict',
            message,
          });
          expect(response.body.stack).toBeUndefined();
          expect(
            await schedulingSnapshot(
              fixture.targetInstitution.id,
              fixture.targetPeriod.id,
            ),
          ).toEqual(before);
        };

        await rejectPublished(
          () =>
            request(app.getHttpServer())
              .put(`/v1/timetables/${timetableId}/slots`)
              .set(auth(token))
              .send({ expectedVersion: 999, slots: proposalSlots }),
          'Published timetables cannot be modified',
        );
        await rejectPublished(
          () =>
            request(app.getHttpServer())
              .delete(`/v1/timetables/${timetableId}`)
              .set(auth(token)),
          'Published timetables cannot be discarded',
        );
      } finally {
        await fixture.cleanup();
      }
    });
  });

  describe('structured conflict diagnostics', () => {
    let timetableId: string;
    let version: number;
    let validSlots: Array<{
      teacherAssignmentId: string;
      weekday: Weekday;
      scheduleBlockId: string;
    }>;
    let teacherConflictAssignmentId: string;
    let courseConflictAssignmentId: string;
    let primaryConflictAssignmentId: string;
    let primaryCourseId: string;
    let primarySlot: (typeof validSlots)[number];
    let extraCell: { weekday: Weekday; scheduleBlockId: string };
    let breakBlockId: string;
    let nonTeachingBlockId: string;
    let foreignAssignmentId: string;
    let fixtureAssignmentIds: string[] = [];
    let fixtureCourseIds: string[] = [];
    let fixtureSubjectIds: string[] = [];
    let fixtureBlockIds: string[] = [];

    const rejectReplacement = async (
      slots: typeof validSlots,
      expectedCode: string,
    ) => {
      const before = await timetableSnapshot(timetableId);
      const response = await request(app.getHttpServer())
        .put(`/v1/timetables/${timetableId}/slots`)
        .set(auth(adminToken))
        .send({ expectedVersion: version, slots })
        .expect(400);
      const conflicts = responseConflicts(response);
      expect(conflicts.map((conflict) => conflict.code)).toContain(
        expectedCode,
      );
      expect(await timetableSnapshot(timetableId)).toEqual(before);
      return conflicts;
    };

    beforeEach(async () => {
      await clearTimetables();
      const sourceAssignments = await prisma.teacherAssignment.findMany({
        where: { institutionId, academicPeriodId },
        include: { teachingLoad: true, course: true },
        orderBy: { id: 'asc' },
      });
      if (sourceAssignments.length < 2) {
        throw new Error('Timetable E2E requires two QA teacher assignments.');
      }
      const [firstSource, secondSource] = sourceAssignments;
      if (!firstSource.teachingLoad || !secondSource.teachingLoad) {
        throw new Error('Timetable E2E requires QA teaching loads.');
      }
      const suffix = `conflict-e2e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const structure = await prisma.periodScheduleStructure.findUniqueOrThrow({
        where: {
          institutionId_academicPeriodId: { institutionId, academicPeriodId },
        },
        include: { scheduleBlocks: { orderBy: { position: 'asc' } } },
      });
      let nextPosition =
        Math.max(
          ...structure.scheduleBlocks.map((block) => block.position),
          0,
        ) + 1;
      const [breakBlock, nonTeachingBlock] = await prisma.$transaction([
        prisma.scheduleBlock.create({
          data: {
            periodScheduleStructureId: structure.id,
            position: nextPosition++,
            name: `E2E break ${suffix}`,
            startTime: new Date('1970-01-01T10:00:00.000Z'),
            endTime: new Date('1970-01-01T10:10:00.000Z'),
            kind: ScheduleBlockKind.BREAK,
          },
        }),
        prisma.scheduleBlock.create({
          data: {
            periodScheduleStructureId: structure.id,
            position: nextPosition++,
            name: `E2E non-teaching ${suffix}`,
            startTime: new Date('1970-01-01T10:10:00.000Z'),
            endTime: new Date('1970-01-01T10:20:00.000Z'),
            kind: ScheduleBlockKind.NON_TEACHING,
          },
        }),
      ]);
      breakBlockId = breakBlock.id;
      nonTeachingBlockId = nonTeachingBlock.id;
      fixtureBlockIds = [breakBlock.id, nonTeachingBlock.id];

      const [
        courseOne,
        courseTwo,
        foreignCourse,
        subjectOne,
        subjectTwo,
        subjectThree,
        foreignSubject,
      ] = await prisma.$transaction([
        prisma.course.create({
          data: {
            name: `E2E conflict course one ${suffix}`,
            section: `E2E1-${suffix}`,
            institutionId,
            academicPeriodId,
            gradeLevelId: firstSource.course.gradeLevelId,
            subLevelId: firstSource.course.subLevelId,
          },
        }),
        prisma.course.create({
          data: {
            name: `E2E conflict course two ${suffix}`,
            section: `E2E2-${suffix}`,
            institutionId,
            academicPeriodId,
            gradeLevelId: firstSource.course.gradeLevelId,
            subLevelId: firstSource.course.subLevelId,
          },
        }),
        prisma.course.create({
          data: {
            name: `E2E foreign course ${suffix}`,
            section: `E2EB-${suffix}`,
            institutionId: institutionBId,
            academicPeriodId: periodBId,
            gradeLevelId: firstSource.course.gradeLevelId,
            subLevelId: firstSource.course.subLevelId,
          },
        }),
        prisma.subject.create({
          data: {
            name: `E2E conflict one ${suffix}`,
            code: `E2E1-${suffix}`,
            institutionId,
          },
        }),
        prisma.subject.create({
          data: {
            name: `E2E conflict two ${suffix}`,
            code: `E2E2-${suffix}`,
            institutionId,
          },
        }),
        prisma.subject.create({
          data: {
            name: `E2E conflict three ${suffix}`,
            code: `E2E3-${suffix}`,
            institutionId,
          },
        }),
        prisma.subject.create({
          data: {
            name: `E2E foreign ${suffix}`,
            code: `E2EB-${suffix}`,
            institutionId: institutionBId,
          },
        }),
      ]);
      fixtureCourseIds = [courseOne.id, courseTwo.id, foreignCourse.id];
      fixtureSubjectIds = [
        subjectOne.id,
        subjectTwo.id,
        subjectThree.id,
        foreignSubject.id,
      ];
      const [primary, sameTeacher, sameCourse, foreign] =
        await prisma.$transaction([
          prisma.teacherAssignment.create({
            data: {
              institutionId,
              academicPeriodId,
              teacherId: firstSource.teacherId,
              courseId: courseOne.id,
              subjectId: subjectOne.id,
              teachingLoad: { create: { weeklyPeriods: 1 } },
            },
          }),
          prisma.teacherAssignment.create({
            data: {
              institutionId,
              academicPeriodId,
              teacherId: firstSource.teacherId,
              courseId: courseTwo.id,
              subjectId: subjectTwo.id,
              teachingLoad: { create: { weeklyPeriods: 1 } },
            },
          }),
          prisma.teacherAssignment.create({
            data: {
              institutionId,
              academicPeriodId,
              teacherId: secondSource.teacherId,
              courseId: courseOne.id,
              subjectId: subjectThree.id,
              teachingLoad: { create: { weeklyPeriods: 1 } },
            },
          }),
          prisma.teacherAssignment.create({
            data: {
              institutionId: institutionBId,
              academicPeriodId: periodBId,
              teacherId: firstSource.teacherId,
              courseId: foreignCourse.id,
              subjectId: foreignSubject.id,
            },
          }),
        ]);
      fixtureAssignmentIds = [
        primary.id,
        sameTeacher.id,
        sameCourse.id,
        foreign.id,
      ];
      primaryConflictAssignmentId = primary.id;
      teacherConflictAssignmentId = sameTeacher.id;
      courseConflictAssignmentId = sameCourse.id;
      primaryCourseId = courseOne.id;
      foreignAssignmentId = foreign.id;

      const assignments = await prisma.teacherAssignment.findMany({
        where: { institutionId, academicPeriodId },
        include: { teachingLoad: true },
        orderBy: { id: 'asc' },
      });
      const requiredSlots = assignments.reduce(
        (total, assignment) =>
          total + (assignment.teachingLoad?.weeklyPeriods ?? 0),
        0,
      );
      const teachingBlocks = structure.scheduleBlocks.filter(
        (block) => block.kind === ScheduleBlockKind.TEACHING,
      );
      while (teachingBlocks.length * 2 <= requiredSlots) {
        const block = await prisma.scheduleBlock.create({
          data: {
            periodScheduleStructureId: structure.id,
            position: nextPosition++,
            name: `E2E teaching ${suffix}-${teachingBlocks.length + 1}`,
            startTime: new Date('1970-01-01T11:00:00.000Z'),
            endTime: new Date('1970-01-01T11:40:00.000Z'),
            kind: ScheduleBlockKind.TEACHING,
          },
        });
        fixtureBlockIds.push(block.id);
        teachingBlocks.push(block);
      }
      const cells = [Weekday.MON, Weekday.TUE].flatMap((weekday) =>
        teachingBlocks.map((block) => ({ weekday, scheduleBlockId: block.id })),
      );
      let cellIndex = 0;
      validSlots = assignments.flatMap((assignment) =>
        Array.from(
          { length: assignment.teachingLoad?.weeklyPeriods ?? 0 },
          () => ({
            teacherAssignmentId: assignment.id,
            ...cells[cellIndex++],
          }),
        ),
      );
      extraCell = cells[cellIndex];
      primarySlot = validSlots.find(
        (slot) => slot.teacherAssignmentId === primaryConflictAssignmentId,
      )!;
      const created = await request(app.getHttpServer())
        .post(basePath)
        .set(auth(adminToken))
        .send({ slots: validSlots })
        .expect(201);
      timetableId = created.body.id as string;
      version = created.body.version as number;
    });

    afterEach(async () => {
      await clearTimetables();
      await prisma.teachingLoad.deleteMany({
        where: { teacherAssignmentId: { in: fixtureAssignmentIds } },
      });
      await prisma.teacherAssignment.deleteMany({
        where: { id: { in: fixtureAssignmentIds } },
      });
      await prisma.course.deleteMany({
        where: { id: { in: fixtureCourseIds } },
      });
      await prisma.subject.deleteMany({
        where: { id: { in: fixtureSubjectIds } },
      });
      await prisma.scheduleBlock.deleteMany({
        where: { id: { in: fixtureBlockIds } },
      });
    });

    it('returns deterministic teacher, course, and duplicate conflict diagnostics', async () => {
      const teacherConflicts = await rejectReplacement(
        [
          ...validSlots,
          { ...primarySlot, teacherAssignmentId: teacherConflictAssignmentId },
        ],
        'TEACHER_CONFLICT',
      );
      expect(
        teacherConflicts.find(
          (conflict) => conflict.code === 'TEACHER_CONFLICT',
        ),
      ).toMatchObject({
        teacherAssignmentIds: expect.arrayContaining([
          primaryConflictAssignmentId,
          teacherConflictAssignmentId,
        ]),
        scheduleBlockId: primarySlot.scheduleBlockId,
        weekday: primarySlot.weekday,
      });
      const courseConflicts = await rejectReplacement(
        [
          ...validSlots,
          { ...primarySlot, teacherAssignmentId: courseConflictAssignmentId },
        ],
        'COURSE_CONFLICT',
      );
      expect(
        courseConflicts.find((conflict) => conflict.code === 'COURSE_CONFLICT'),
      ).toMatchObject({
        courseIds: [primaryCourseId],
        scheduleBlockId: primarySlot.scheduleBlockId,
        weekday: primarySlot.weekday,
      });
      const duplicateSlots = [...validSlots, { ...primarySlot }];
      const first = await rejectReplacement(
        duplicateSlots,
        'DUPLICATE_CANDIDATE',
      );
      const second = await rejectReplacement(
        duplicateSlots,
        'DUPLICATE_CANDIDATE',
      );
      expect(second).toEqual(first);
      expect(
        first.find((conflict) => conflict.code === 'DUPLICATE_CANDIDATE'),
      ).toMatchObject({
        teacherAssignmentIds: [primaryConflictAssignmentId],
        expectedWeeklyPeriods: null,
        actualWeeklyPeriods: null,
      });
    });

    it('returns invalid block, day, and context mismatch diagnostics without writes', async () => {
      for (const scheduleBlockId of [breakBlockId, nonTeachingBlockId]) {
        const conflicts = await rejectReplacement(
          validSlots.map((slot) =>
            slot.teacherAssignmentId === primaryConflictAssignmentId
              ? { ...slot, scheduleBlockId }
              : slot,
          ),
          'INVALID_BLOCK',
        );
        expect(
          conflicts.find((conflict) => conflict.code === 'INVALID_BLOCK'),
        ).toMatchObject({
          scheduleBlockId,
          weekday: primarySlot.weekday,
        });
      }
      const invalidDay = await rejectReplacement(
        validSlots.map((slot) =>
          slot.teacherAssignmentId === primaryConflictAssignmentId
            ? { ...slot, weekday: Weekday.WED }
            : slot,
        ),
        'INVALID_DAY',
      );
      expect(
        invalidDay.find((conflict) => conflict.code === 'INVALID_DAY'),
      ).toMatchObject({
        weekday: Weekday.WED,
        scheduleBlockId: primarySlot.scheduleBlockId,
      });
      const contextMismatch = await rejectReplacement(
        validSlots.map((slot) =>
          slot.teacherAssignmentId === primaryConflictAssignmentId
            ? { ...slot, teacherAssignmentId: foreignAssignmentId }
            : slot,
        ),
        'CONTEXT_MISMATCH',
      );
      expect(
        contextMismatch.find(
          (conflict) => conflict.code === 'CONTEXT_MISMATCH',
        ),
      ).toMatchObject({
        teacherAssignmentIds: [foreignAssignmentId],
      });
    });

    it('permits an incomplete PARTIAL draft while COMPLETE validation reports unmet loads', async () => {
      const partialSlots = [primarySlot];
      const replacement = await request(app.getHttpServer())
        .put(`/v1/timetables/${timetableId}/slots`)
        .set(auth(adminToken))
        .send({ expectedVersion: version, slots: partialSlots })
        .expect(200);
      expect(replacement.body.version).toBe(version + 1);
      const validation = await request(app.getHttpServer())
        .get(`/v1/timetables/${timetableId}/validation`)
        .set(auth(adminToken))
        .expect(200);
      expect(validation.body).toMatchObject({ valid: false, mode: 'COMPLETE' });
      expect(
        responseConflicts(validation).find(
          (conflict) => conflict.code === 'LOAD_UNSATISFIED',
        ),
      ).toMatchObject({
        expectedWeeklyPeriods: expect.any(Number),
        actualWeeklyPeriods: 0,
      });
    });

    it('rejects oversatisfied loads and enforces the missing-load API boundary without writes', async () => {
      const oversatisfied = await rejectReplacement(
        [
          ...validSlots,
          {
            teacherAssignmentId: primaryConflictAssignmentId,
            ...extraCell,
          },
        ],
        'LOAD_OVERSATISFIED',
      );
      expect(
        oversatisfied.find(
          (conflict) => conflict.code === 'LOAD_OVERSATISFIED',
        ),
      ).toMatchObject({
        teacherAssignmentIds: [primaryConflictAssignmentId],
        expectedWeeklyPeriods: 1,
        actualWeeklyPeriods: 2,
      });

      const before = await timetableSnapshot(timetableId);
      await prisma.teachingLoad.delete({
        where: { teacherAssignmentId: primaryConflictAssignmentId },
      });
      const response = await request(app.getHttpServer())
        .put(`/v1/timetables/${timetableId}/slots`)
        .set(auth(adminToken))
        .send({ expectedVersion: version, slots: validSlots })
        .expect(400);
      expect(response.body.message).toBe(
        'Every teacher assignment requires a configured teaching load',
      );
      expect(await timetableSnapshot(timetableId)).toEqual(before);
    });
  });
});
