import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AcademicPerformanceService } from '../academic-performance/academic-performance.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReportCardsService } from './report-cards.service';

const studentActor: AuthenticatedUser = {
  id: 'user-1',
  email: 'student@example.test',
  firstName: 'Student',
  lastName: 'One',
  role: Role.STUDENT,
  profileId: 'student-1',
  profileType: 'student',
};

describe('ReportCardsService authorization', () => {
  const service = new ReportCardsService(
    {} as ConstructorParameters<typeof ReportCardsService>[0],
    {} as AcademicPerformanceService,
    {} as ConstructorParameters<typeof ReportCardsService>[2],
  );

  it('rejects a student profile that is missing from the authenticated actor', () => {
    expect(() =>
      service.getMyReportCard(
        { ...studentActor, profileId: undefined },
        { academicPeriodId: 'period-1' },
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects IDOR-style student lookup attempts', () => {
    expect(() =>
      service.getStudentReportCard(studentActor, 'another-student', {
        academicPeriodId: 'period-1',
      }),
    ).toThrow(ForbiddenException);
  });
});
