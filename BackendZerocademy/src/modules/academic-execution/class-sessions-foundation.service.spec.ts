/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matcher values are intentionally untyped. */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ClassSessionStatus, Role, Weekday } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ClassSessionsFoundationService } from './class-sessions-foundation.service';

const teacher: AuthenticatedUser = {
  id: 'teacher-user-a',
  email: 'teacher-a@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile-a',
  institutionId: 'institution-a',
};

type PrismaMock = {
  teacherAssignment: { findFirst: jest.Mock };
  lessonPlan: { findFirst: jest.Mock };
  classSession: { create: jest.Mock; findUnique: jest.Mock };
};

function assignmentContext(periodStatus = 'ACTIVE', id = 'assignment-a') {
  return {
    id,
    teacherId: 'teacher-profile-a',
    institutionId: 'institution-a',
    academicPeriod: {
      id: 'period-a',
      status: periodStatus,
      startDate: new Date('2026-05-01T00:00:00.000Z'),
      endDate: new Date('2027-02-28T00:00:00.000Z'),
    },
  };
}

describe('ClassSessionsFoundationService', () => {
  let service: ClassSessionsFoundationService;
  let prisma: PrismaMock;
  let logger: { log: jest.Mock };

  beforeEach(() => {
    prisma = {
      teacherAssignment: {
        findFirst: jest.fn().mockResolvedValue(assignmentContext()),
      },
      lessonPlan: {
        findFirst: jest.fn().mockResolvedValue({ id: 'lesson-a' }),
      },
      classSession: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'session-a', ...data }),
          ),
      },
    };
    logger = { log: jest.fn() };
    service = new ClassSessionsFoundationService(
      prisma as unknown as PrismaService,
      logger as unknown as AppLoggerService,
      {
        requireForInstitutionMembership: jest.fn().mockResolvedValue({
          decision: 'ALLOWED',
        }),
      } as never,
      {
        resolvePublishedForAssignment: jest.fn().mockResolvedValue({
          id: 'slot-a',
          teacherAssignmentId: 'assignment-a',
          weekday: Weekday.MON,
          institutionId: 'institution-a',
          institutionName: 'Institution A',
          academicPeriodId: 'period-a',
          academicPeriodName: '2026-2027',
          courseId: 'course-a',
          courseName: 'Course A',
          subjectId: 'subject-a',
          subjectName: 'Subject A',
          scheduleBlockId: 'block-a',
          startTime: new Date('1970-01-01T08:00:00.000Z'),
          endTime: new Date('1970-01-01T09:00:00.000Z'),
        }),
      } as never,
    );
  });

  it('creates a scheduled session owned by the teacher assignment without a lesson plan', async () => {
    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-06-15',
      }),
    ).resolves.toMatchObject({
      id: 'session-a',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: undefined,
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: null,
    });
    expect(prisma.teacherAssignment.findFirst).toHaveBeenCalledWith({
      where: { id: 'assignment-a' },
      select: {
        id: true,
        teacherId: true,
        institutionId: true,
        academicPeriod: {
          select: { id: true, status: true, startDate: true, endDate: true },
        },
      },
    });
    expect(prisma.lessonPlan.findFirst).not.toHaveBeenCalled();
    expect(prisma.classSession.create).toHaveBeenCalledWith({
      data: {
        teacherAssignmentId: 'assignment-a',
        lessonPlanId: undefined,
        status: ClassSessionStatus.SCHEDULED,
        scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
        occurredOn: null,
      },
    });
  });

  it('accepts a lesson plan from the same teacher assignment', async () => {
    await service.create(teacher, {
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: 'lesson-a',
      scheduledDate: '2026-06-15',
    });

    expect(prisma.lessonPlan.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'lesson-a',
        academicUnit: {
          academicPlan: { teacherAssignmentId: 'assignment-a' },
        },
      },
      select: { id: true },
    });
  });

  it('rejects a lesson plan from another teacher assignment', async () => {
    prisma.lessonPlan.findFirst.mockResolvedValue(null);
    prisma.teacherAssignment.findFirst.mockResolvedValue(
      assignmentContext('ACTIVE', 'assignment-b'),
    );

    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-b',
        lessonPlanId: 'lesson-a',
        scheduledDate: '2026-06-15',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('rejects a session when the teacher does not own the assignment', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue(null);

    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-b',
        scheduledDate: '2026-06-15',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('rejects mutation during a closed academic period', async () => {
    prisma.teacherAssignment.findFirst.mockResolvedValue(
      assignmentContext('CLOSED'),
    );

    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-06-15',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('preserves a completed session actual occurrence calendar date without a scheduled date', async () => {
    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        status: ClassSessionStatus.COMPLETED,
        occurredOn: '2026-06-16',
      }),
    ).resolves.toMatchObject({
      status: ClassSessionStatus.COMPLETED,
      scheduledDate: null,
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
    });
  });

  it('requires the calendar date appropriate to the operational status', async () => {
    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        status: ClassSessionStatus.SCHEDULED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        status: ClassSessionStatus.COMPLETED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('rejects non-calendar and out-of-period dates', async () => {
    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2026-02-30',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.create(teacher, {
        teacherAssignmentId: 'assignment-a',
        scheduledDate: '2027-03-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('creates one scheduled session with an immutable timetable occurrence snapshot', async () => {
    await expect(
      service.openFromTimetableSlot(teacher, {
        teacherAssignmentId: 'assignment-a',
        timetableSlotId: 'slot-a',
        scheduledDate: '2026-06-15',
      }),
    ).resolves.toMatchObject({ created: true });

    expect(prisma.classSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        teacherAssignmentId: 'assignment-a',
        timetableSlotId: 'slot-a',
        timetableOccurrenceKey: 'timetable-slot:slot-a:2026-06-15',
        originCourseId: 'course-a',
        originCourseName: 'Course A',
        originInstitutionName: 'Institution A',
        originAcademicPeriodName: '2026-2027',
        originSubjectId: 'subject-a',
        originSubjectName: 'Subject A',
        originWeekday: Weekday.MON,
        status: ClassSessionStatus.SCHEDULED,
        scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      }),
    });
  });

  it('reopens an existing completed or cancelled occurrence without mutation', async () => {
    prisma.classSession.findUnique.mockResolvedValue({
      id: 'session-existing',
      status: ClassSessionStatus.CANCELLED,
      timetableOccurrenceKey: 'timetable-slot:slot-a:2026-06-15',
    });

    await expect(
      service.openFromTimetableSlot(teacher, {
        teacherAssignmentId: 'assignment-a',
        timetableSlotId: 'slot-a',
        scheduledDate: '2026-06-15',
      }),
    ).resolves.toEqual({
      classSession: expect.objectContaining({
        id: 'session-existing',
        status: ClassSessionStatus.CANCELLED,
      }),
      created: false,
    });
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });

  it('returns the winner session when the occurrence unique constraint reports a concurrent create', async () => {
    prisma.classSession.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'session-winner',
        status: ClassSessionStatus.SCHEDULED,
      });
    prisma.classSession.create.mockRejectedValueOnce({
      code: 'P2002',
      meta: { target: ['timetableOccurrenceKey'] },
    });

    await expect(
      service.openFromTimetableSlot(teacher, {
        teacherAssignmentId: 'assignment-a',
        timetableSlotId: 'slot-a',
        scheduledDate: '2026-06-15',
      }),
    ).resolves.toEqual({
      classSession: expect.objectContaining({ id: 'session-winner' }),
      created: false,
    });
  });

  it('rejects a calendar date that does not match the published slot weekday', async () => {
    await expect(
      service.openFromTimetableSlot(teacher, {
        teacherAssignmentId: 'assignment-a',
        timetableSlotId: 'slot-a',
        scheduledDate: '2026-06-16',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.classSession.create).not.toHaveBeenCalled();
  });
});
