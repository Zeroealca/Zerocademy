import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TeacherAssignmentsService } from './teacher-assignments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { assertCourseAndPeriodIntegrity } from './teacher-assignment.validation';

jest.mock('./teacher-assignment.validation', () => ({
  assertTeacherExistsAndActive: jest.fn(),
  assertSubjectExistsAndActive: jest.fn(),
  assertSubjectAppliesToGrade: jest.fn(),
  assertUniqueAssignment: jest.fn(),
  assertCourseAndPeriodIntegrity: jest.fn(),
  mapPrismaConflict: jest.fn((error: unknown) => { throw error; }),
}));

describe('Teacher assignment institution scope', () => {
  const actor: AuthenticatedUser = {
    id: 'admin', role: Role.ADMIN, email: 'admin@example.test',
    firstName: 'Admin', lastName: 'Test', institutionId: 'school-a',
  };
  const dto = {
    institutionId: 'school-b', teacherId: 'teacher', subjectId: 'subject',
    courseId: 'course-b', academicPeriodId: 'period',
  };
  let service: TeacherAssignmentsService;
  let prisma: {
    teacherProfile: { findUniqueOrThrow: jest.Mock };
    subject: { findUniqueOrThrow: jest.Mock };
    institutionMembership: { findFirst: jest.Mock };
    teacherAssignment: { create: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(assertCourseAndPeriodIntegrity).mockResolvedValue({
      gradeLevelId: 'grade', institutionId: 'school-b',
    });
    prisma = {
      teacherProfile: { findUniqueOrThrow: jest.fn().mockResolvedValue({ userId: 'teacher-user', institutionId: 'school-a' }) },
      subject: { findUniqueOrThrow: jest.fn().mockResolvedValue({ institutionId: null }) },
      institutionMembership: { findFirst: jest.fn().mockResolvedValue({ id: 'membership' }) },
      teacherAssignment: { create: jest.fn().mockResolvedValue({
        ...dto, id: 'assignment', teacher: { user: { firstName: 'Teacher', lastName: 'Test' } },
        subject: { name: 'Math', code: 'MATH' }, course: { name: 'Course' },
        academicPeriod: { name: 'Period' }, createdAt: new Date(0), updatedAt: new Date(0),
      }) },
    };
    service = new TeacherAssignmentsService(
      prisma as unknown as PrismaService,
      { log: jest.fn(), warn: jest.fn() } as unknown as AppLoggerService,
    );
  });

  it('allows the administrator and teacher to use a second active institution membership', async () => {
    await expect(service.create(dto, actor)).resolves.toMatchObject({ institutionId: 'school-b' });
    expect(prisma.teacherAssignment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ institutionId: 'school-b' }),
    }));
  });

  it('rejects a course outside the explicitly selected institution', async () => {
    await expect(service.create({ ...dto, institutionId: 'school-a' }, actor)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
  });

  it('rejects an administrator without access to the course institution', async () => {
    prisma.institutionMembership.findFirst.mockResolvedValue(null);
    await expect(service.create(dto, actor)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
  });

  it('rejects a teacher without an active membership in the course institution', async () => {
    prisma.institutionMembership.findFirst.mockResolvedValueOnce({ id: 'admin-membership' }).mockResolvedValueOnce(null);
    await expect(service.create(dto, actor)).rejects.toThrow('El docente no pertenece');
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
  });

  it('rejects a subject belonging to another institution', async () => {
    prisma.subject.findUniqueOrThrow.mockResolvedValue({ institutionId: 'school-a' });
    await expect(service.create(dto, actor)).rejects.toThrow('La materia no pertenece');
    expect(prisma.teacherAssignment.create).not.toHaveBeenCalled();
  });
});
