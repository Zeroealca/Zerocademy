/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- lightweight Prisma transaction mock. */
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, ClassSessionStatus, Role } from '@prisma/client';
import { ClassSessionAttendanceService } from './class-session-attendance.service';

const teacher = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  institutionId: 'institution-a',
};
const session = (
  status: ClassSessionStatus = ClassSessionStatus.COMPLETED,
  periodStatus = 'ACTIVE',
) => ({
  id: 'session-a',
  status,
  scheduledDate: new Date('2026-09-01'),
  occurredOn: new Date('2026-09-01'),
  teacherAssignment: {
    id: 'assignment-a',
    teacherId: 'teacher-profile',
    courseId: 'course-a',
    academicPeriodId: 'period-a',
    institutionId: 'institution-a',
    academicPeriod: { status: periodStatus },
  },
});

describe('ClassSessionAttendanceService', () => {
  let prisma: any;
  let permissionEnforcer: { requireForInstitutionMembership: jest.Mock };
  let logger: { log: jest.Mock };
  let service: ClassSessionAttendanceService;
  beforeEach(() => {
    permissionEnforcer = {
      requireForInstitutionMembership: jest
        .fn()
        .mockResolvedValue({ decision: 'ALLOWED' }),
    };
    logger = { log: jest.fn() };
    prisma = {
      classSession: { findFirst: jest.fn().mockResolvedValue(session()) },
      enrollment: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'enrollment-a',
            studentId: 'student-a',
            student: { user: { firstName: 'Ana', lastName: 'Pérez' } },
            classSessionAttendanceRecords: [],
          },
        ]),
      },
      classSessionAttendanceRecord: { count: jest.fn().mockResolvedValue(0) },
      $transaction: jest.fn((work: (tx: any) => Promise<void>) =>
        work({
          classSessionAttendanceRecord: {
            deleteMany: jest.fn(),
            createMany: jest.fn(),
          },
        }),
      ),
    };
    service = new ClassSessionAttendanceService(
      prisma,
      logger as never,
      permissionEnforcer as never,
    );
  });

  it('returns an unrecorded eligible roster after one attendance.read evaluation', async () => {
    await expect(
      service.getRoster(teacher, 'assignment-a', 'session-a'),
    ).resolves.toMatchObject({
      isReadOnly: false,
      records: [{ enrollmentId: 'enrollment-a', status: null, note: null }],
    });
    expect(
      permissionEnforcer.requireForInstitutionMembership,
    ).toHaveBeenCalledTimes(1);
    expect(
      permissionEnforcer.requireForInstitutionMembership,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        permission: 'attendance.read',
        resourceId: 'session-a',
      }),
    );
  });

  it('replaces the complete roster atomically and records the current actor', async () => {
    await service.replace(teacher, 'assignment-a', 'session-a', {
      records: [
        {
          enrollmentId: 'enrollment-a',
          status: AttendanceStatus.LATE,
          note: ' Bus ',
        },
      ],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(
      permissionEnforcer.requireForInstitutionMembership,
    ).toHaveBeenCalledWith(
      expect.objectContaining({ permission: 'attendance.write' }),
    );
    expect(logger.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'CLASS_SESSION_ATTENDANCE_RECORDED' }),
    );
  });

  it('fails closed before persistence when permission enforcement denies', async () => {
    permissionEnforcer.requireForInstitutionMembership.mockRejectedValue(
      new ForbiddenException(),
    );
    await expect(
      service.replace(teacher, 'assignment-a', 'session-a', {
        records: [
          { enrollmentId: 'enrollment-a', status: AttendanceStatus.PRESENT },
        ],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([ClassSessionStatus.SCHEDULED, ClassSessionStatus.CANCELLED])(
    'rejects writes for %s sessions',
    async (status) => {
      prisma.classSession.findFirst.mockResolvedValue(session(status));
      await expect(
        service.replace(teacher, 'assignment-a', 'session-a', {
          records: [
            { enrollmentId: 'enrollment-a', status: AttendanceStatus.PRESENT },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    },
  );

  it('preserves owner isolation before permission evaluation', async () => {
    prisma.classSession.findFirst.mockResolvedValue({
      ...session(),
      teacherAssignment: {
        ...session().teacherAssignment,
        teacherId: 'other-teacher',
      },
    });
    await expect(
      service.getRoster(teacher, 'assignment-a', 'session-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      permissionEnforcer.requireForInstitutionMembership,
    ).not.toHaveBeenCalled();
  });
});
