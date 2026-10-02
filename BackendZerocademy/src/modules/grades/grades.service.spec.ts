import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { GradesService } from './grades.service';
import {
  GradeSheetOperation,
  type BulkUpsertGradesDto,
} from './dto/bulk-upsert-grades.dto';

const decimal = (value: number) => ({ toNumber: () => value });

describe('GradesService grade-sheet save', () => {
  const actor = {
    id: 'teacher-user',
    role: Role.TEACHER,
    profileId: 'teacher-profile',
  };

  const assessment = {
    id: 'assessment-id',
    institutionId: 'institution-id',
    maxScore: decimal(10),
    teacherAssignmentId: 'assignment-id',
    teacherAssignment: {
      teacherId: 'teacher-profile',
      courseId: 'course-id',
      academicPeriodId: 'period-id',
    },
  };

  function createService() {
    const tx = {
      grade: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ id: 'grade-id' }),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      gradeAuditEvent: {
        create: jest.fn().mockResolvedValue({ id: 'audit-id' }),
      },
    };
    const prisma = {
      assessment: { findUnique: jest.fn().mockResolvedValue(assessment) },
      institutionAcademicConfiguration: {
        findUnique: jest.fn().mockResolvedValue({
          gradingSchemeId: 'scheme-id',
          decimalPlaces: 2,
          gradingScheme: {
            isActive: true,
            minScore: decimal(0),
            maxScore: decimal(10),
          },
        }),
      },
      teacherAssignment: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'assignment-id',
          institutionId: 'institution-id',
          teacherId: 'teacher-profile',
          subjectId: 'subject-id',
          courseId: 'course-id',
          academicPeriodId: 'period-id',
        }),
      },
      enrollment: {
        findMany: jest.fn().mockResolvedValue([{ id: 'enrollment-id' }]),
      },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
    };
    const logger = { log: jest.fn(), warn: jest.fn() };
    const permissionEnforcer = {
      requireForInstitutionMembership: jest
        .fn()
        .mockResolvedValue({ decision: 'ALLOWED' }),
    };
    return {
      service: new GradesService(
        prisma as never,
        logger as never,
        permissionEnforcer as never,
      ),
      prisma,
      tx,
      permissionEnforcer,
    };
  }

  it('rejects duplicate enrollment entries before persistence', async () => {
    const { service, prisma } = createService();
    const dto: BulkUpsertGradesDto = {
      assessmentId: 'assessment-id',
      entries: [
        {
          enrollmentId: 'enrollment-id',
          operation: GradeSheetOperation.SET,
          score: 0,
          expectedUpdatedAt: null,
        },
        {
          enrollmentId: 'enrollment-id',
          operation: GradeSheetOperation.CLEAR,
          expectedUpdatedAt: null,
        },
      ],
    };

    await expect(service.bulkUpsert(actor as never, dto)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates a zero score and its immutable audit event in one transaction', async () => {
    const { service, prisma, tx, permissionEnforcer } = createService();
    const dto: BulkUpsertGradesDto = {
      assessmentId: 'assessment-id',
      entries: [
        {
          enrollmentId: 'enrollment-id',
          operation: GradeSheetOperation.SET,
          score: 0,
          observations: null,
          expectedUpdatedAt: null,
        },
      ],
    };

    await expect(service.bulkUpsert(actor as never, dto)).resolves.toEqual({
      createdCount: 1,
      updatedCount: 0,
      clearedCount: 0,
      unchangedCount: 0,
    });
    expect(
      permissionEnforcer.requireForInstitutionMembership,
    ).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.grade.create).toHaveBeenCalledTimes(1);
    expect(tx.gradeAuditEvent.create).toHaveBeenCalledTimes(1);
  });
});
