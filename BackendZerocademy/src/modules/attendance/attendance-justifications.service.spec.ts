import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { JustificationReviewDecision } from './dto/attendance-justification.dto';
import { AttendanceJustificationsService } from './attendance-justifications.service';

const student: AuthenticatedUser = {
  id: 'student-user',
  email: 'student@example.test',
  firstName: 'Student',
  lastName: 'One',
  role: Role.STUDENT,
  profileType: 'student',
};
const representative: AuthenticatedUser = {
  id: 'representative-user',
  email: 'representative@example.test',
  firstName: 'Representative',
  lastName: 'One',
  role: Role.REPRESENTATIVE,
  profileType: 'representative',
};

describe('AttendanceJustificationsService authorization', () => {
  const service = new AttendanceJustificationsService(
    {} as never,
    { log: jest.fn() } as never,
  );

  it('does not reveal records when the student profile is absent', async () => {
    await expect(
      service.create(student, 'attendance-other', { reason: 'Medical visit' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires a decision comment before rejecting', async () => {
    await expect(
      service.review({ ...student, role: Role.ADMIN }, 'justification-1', {
        decision: JustificationReviewDecision.REJECT,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('submits through the existing workflow for an associated representative student', async () => {
    const prisma = {
      attendanceRecord: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'attendance-1',
          institutionId: 'institution-1',
          academicPeriod: { status: 'ACTIVE' },
          enrollment: { student: { institutionId: 'institution-1' } },
        }),
      },
      attendanceJustification: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'justification-1',
          status: 'PENDING',
          createdAt: new Date(),
        }),
      },
    };
    const logger = { log: jest.fn() };
    const representativeService = new AttendanceJustificationsService(
      prisma as never,
      logger as never,
    );

    await expect(
      representativeService.create(representative, 'attendance-1', {
        reason: 'Medical appointment',
      }),
    ).resolves.toMatchObject({ id: 'justification-1', status: 'PENDING' });

    expect(prisma.attendanceRecord.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.attendanceJustification.create).toHaveBeenCalledTimes(1);
  });

  it('does not reveal an unrelated attendance record to a representative', async () => {
    const prisma = {
      attendanceRecord: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const representativeService = new AttendanceJustificationsService(
      prisma as never,
      { log: jest.fn() } as never,
    );

    await expect(
      representativeService.create(representative, 'attendance-other', {
        reason: 'Medical appointment',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
