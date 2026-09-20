import { NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AttendanceService } from './attendance.service';

const teacher: AuthenticatedUser = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Teacher',
  lastName: 'One',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  profileType: 'teacher',
};

describe('AttendanceService authorization', () => {
  const prisma = {
    course: { findFirst: jest.fn() },
  };
  const service = new AttendanceService(
    prisma as never,
    { log: jest.fn(), warn: jest.fn() } as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('hides a course that is outside the teacher assignment scope', async () => {
    prisma.course.findFirst.mockResolvedValue(null);

    await expect(
      service.getDaily(teacher, {
        academicPeriodId: 'period-1',
        courseId: 'course-other',
        date: '2026-09-18',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('keeps the submitted school date as a UTC calendar-date value', () => {
    const internals = service as unknown as {
      toCalendarDate(date: string): Date;
    };

    expect(internals.toCalendarDate('2026-09-18').toISOString()).toBe(
      '2026-09-18T00:00:00.000Z',
    );
  });
});
