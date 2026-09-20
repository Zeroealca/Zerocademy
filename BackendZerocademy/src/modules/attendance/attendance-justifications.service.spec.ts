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
});
