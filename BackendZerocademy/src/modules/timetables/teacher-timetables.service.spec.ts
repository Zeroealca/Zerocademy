import { NotFoundException } from '@nestjs/common';
import { Role, TimetableStatus, Weekday } from '@prisma/client';
import { TeacherTimetablesService } from './teacher-timetables.service';

const teacher = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Ana',
  lastName: 'Docente',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  institutionId: 'institution-a',
};
const timetable = {
  id: 'timetable-a',
  institutionId: 'institution-a',
  academicPeriodId: 'period-a',
  academicPeriod: { name: '2026-2027' },
  slots: [
    {
      id: 'own-later',
      teacherId: 'teacher-profile',
      teacherAssignmentId: 'assignment-own',
      dayOfWeek: Weekday.MON,
      scheduleBlockId: 'block-2',
      scheduleBlock: {
        id: 'block-2',
        position: 2,
        startTime: new Date('1970-01-01T09:00:00Z'),
        endTime: new Date('1970-01-01T09:40:00Z'),
      },
      teacherAssignment: {
        course: { id: 'course-a', name: '10.º A' },
        subject: { name: 'Matemática' },
      },
    },
    {
      id: 'other',
      teacherId: 'teacher-b',
      teacherAssignmentId: 'assignment-other',
      dayOfWeek: Weekday.MON,
      scheduleBlockId: 'block-1',
      scheduleBlock: {
        id: 'block-1',
        position: 1,
        startTime: new Date('1970-01-01T08:00:00Z'),
        endTime: new Date('1970-01-01T08:40:00Z'),
      },
      teacherAssignment: {
        course: { id: 'course-b', name: '9.º B' },
        subject: { name: 'Historia' },
      },
    },
  ],
};

describe('TeacherTimetablesService', () => {
  const prisma = { timetable: { findMany: jest.fn() } };
  const permissions = {
    requireForInstitutionMembership: jest.fn().mockResolvedValue(undefined),
  };
  const clock = { now: jest.fn(() => new Date('2026-10-19T12:00:00-05:00')) };
  const service = new TeacherTimetablesService(
    prisma as never,
    permissions as never,
    clock,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.timetable.findMany.mockResolvedValue([timetable]);
  });

  it('returns only the authenticated teacher published slots and applies the requested period', async () => {
    const result = await service.weekly(teacher, 'period-a');
    expect(result.data[0]?.slots).toHaveLength(1);
    expect(result.data[0]?.slots[0]).toMatchObject({
      id: 'own-later',
      subjectName: 'Matemática',
    });
    expect(prisma.timetable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest's asymmetric matcher accepts an untyped partial Prisma query.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: expect.objectContaining({
          status: TimetableStatus.PUBLISHED,
          academicPeriodId: 'period-a',
          slots: { some: { teacherId: 'teacher-profile' } },
        }),
      }),
    );
    expect(permissions.requireForInstitutionMembership).toHaveBeenCalledWith(
      expect.objectContaining({
        institutionId: 'institution-a',
        permission: 'timetables.read',
      }),
    );
  });

  it('returns an empty list when no published timetable owns a teacher slot', async () => {
    prisma.timetable.findMany.mockResolvedValue([]);
    await expect(service.weekly(teacher)).resolves.toEqual({ data: [] });
  });

  it('uses the injected clock to select and order Today slots', async () => {
    const earlier = {
      ...timetable.slots[0],
      id: 'own-earlier',
      scheduleBlock: {
        ...timetable.slots[0].scheduleBlock,
        position: 1,
        startTime: new Date('1970-01-01T08:00:00Z'),
      },
    };
    prisma.timetable.findMany.mockResolvedValue([
      { ...timetable, slots: [timetable.slots[0], earlier] },
    ]);
    await expect(service.today(teacher, 'period-a')).resolves.toMatchObject({
      data: [{ slots: [{ id: 'own-earlier' }, { id: 'own-later' }] }],
    });
    expect(clock.now).toHaveBeenCalled();
  });

  it('rejects a caller without a teacher identity', async () => {
    await expect(
      service.weekly({ ...teacher, role: Role.ADMIN, profileId: undefined }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses the real clock dependency when Today receives no test override', async () => {
    await service.today(teacher, 'period-a');
    expect(clock.now).toHaveBeenCalledTimes(1);
  });

  it('returns no classes on a non-instructional day', async () => {
    await expect(
      service.today(teacher, 'period-a', new Date('2026-10-18T12:00:00-05:00')),
    ).resolves.toEqual({
      data: [
        {
          id: 'timetable-a',
          institutionId: 'institution-a',
          academicPeriodId: 'period-a',
          academicPeriodName: '2026-2027',
          slots: [],
        },
      ],
    });
  });
});
