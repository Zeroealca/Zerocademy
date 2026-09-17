import { Role } from '@prisma/client';
import { StudentBulkImportService } from './student-bulk-import.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';
import { ProfileProvisioningService } from '../../common/rbac/profile-provisioning.service';

describe('Student CSV preview', () => {
  const row = 'qa.ok1@example.test,Password123,Mario,Prueba,1790000101,2012-02-01,MALE,,,;';
  const actor = { id: 'admin', role: Role.ADMIN, email: 'admin@example.test', firstName: 'Admin', lastName: 'Test', institutionId: 'school' };
  let prisma: {
    course: { findUnique: jest.Mock };
    academicPeriod: { findUnique: jest.Mock };
    studentProfile: { findFirst: jest.Mock };
    user: { findUnique: jest.Mock };
    enrollment: { findUnique: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: StudentBulkImportService;

  beforeEach(() => {
    prisma = {
      course: { findUnique: jest.fn().mockResolvedValue({ id: 'course', isActive: true, academicPeriodId: 'period', institutionId: 'school' }) },
      academicPeriod: { findUnique: jest.fn().mockResolvedValue({ id: 'period' }) },
      studentProfile: { findFirst: jest.fn().mockResolvedValue(null) },
      user: { findUnique: jest.fn().mockResolvedValue(null) },
      enrollment: { findUnique: jest.fn().mockResolvedValue(null), create: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new StudentBulkImportService(
      prisma as unknown as PrismaService,
      { log: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
      {} as ConfigService<AppConfig, true>,
      {} as ProfileProvisioningService,
    );
  });

  it('previews a new student without creating users, profiles or enrollments', async () => {
    const result = await service.importFromCsv(actor, { csvContent: row, courseId: 'course', academicPeriodId: 'period', dryRun: true });
    expect(result).toMatchObject({ importedCount: 1, skippedCount: 0, failedCount: 0 });
    expect(result.rows).toEqual([expect.objectContaining({ row: 1, firstName: 'Mario', lastName: 'Prueba', email: 'qa.ok1@example.test', status: 'imported' })]);
    expect(result.rows[0]).not.toHaveProperty('password');
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
  });

  it('does not enroll an existing student during preview', async () => {
    prisma.studentProfile.findFirst.mockResolvedValue({ id: 'student' });
    const result = await service.importFromCsv(actor, { csvContent: row, courseId: 'course', academicPeriodId: 'period', dryRun: true });
    expect(result.importedCount).toBe(1);
    expect(prisma.enrollment.create).not.toHaveBeenCalled();
  });

  it('reports the row and reason for an already enrolled student', async () => {
    prisma.studentProfile.findFirst.mockResolvedValue({ id: 'student' });
    prisma.enrollment.findUnique.mockResolvedValue({ id: 'enrollment' });
    const result = await service.importFromCsv(actor, { csvContent: row, courseId: 'course', academicPeriodId: 'period', dryRun: true });
    expect(result.skippedCount).toBe(1);
    expect(result.duplicateWarnings).toEqual([expect.objectContaining({ row: 1, message: expect.any(String) })]);
    expect(result.rows[0]).toMatchObject({ status: 'skipped', message: expect.any(String) });
  });

  it('counts a row duplicated by both email and national ID as one failure and never processes it', async () => {
    const result = await service.importFromCsv(actor, { csvContent: `${row}\n${row}`, courseId: 'course', academicPeriodId: 'period', dryRun: true });
    expect(result).toMatchObject({ importedCount: 1, failedCount: 1 });
    expect(result.errors).toHaveLength(2);
    expect(result.rows[1]).toMatchObject({ row: 2, status: 'failed', message: expect.any(String) });
    expect(prisma.studentProfile.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
