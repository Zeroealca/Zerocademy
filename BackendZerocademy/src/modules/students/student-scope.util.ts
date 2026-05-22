import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';

export async function buildStudentListWhere(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  query: {
    search?: string;
    isActive?: boolean;
    institutionId?: string;
    academicPeriodId?: string;
    courseId?: string;
    excludeEnrolledInPeriodId?: string;
  },
): Promise<Prisma.StudentProfileWhereInput> {
  const where: Prisma.StudentProfileWhereInput = {
    user: { deletedAt: null },
  };

  if (actor.role === Role.STUDENT) {
    where.userId = actor.id;
  } else if (actor.role === Role.TEACHER) {
    if (!actor.profileId) {
      throw new ForbiddenException('Teacher profile is required');
    }

    const assignmentFilter: Prisma.TeacherAssignmentWhereInput = {
      teacherId: actor.profileId,
    };

    if (query.academicPeriodId) {
      assignmentFilter.academicPeriodId = query.academicPeriodId;
    }

    if (query.courseId) {
      assignmentFilter.courseId = query.courseId;
    }

    const assignments = await prisma.teacherAssignment.findMany({
      where: assignmentFilter,
      select: { courseId: true, academicPeriodId: true },
    });

    const courseIds = [...new Set(assignments.map((row) => row.courseId))];

    if (courseIds.length === 0) {
      where.id = '00000000-0000-0000-0000-000000000000';
      return where;
    }

    where.enrollments = {
      some: {
        courseId: { in: courseIds },
        ...(query.academicPeriodId
          ? { academicPeriodId: query.academicPeriodId }
          : {}),
      },
    };
  } else if (actor.role === Role.ADMIN) {
    const institutionId =
      query.institutionId ?? (await resolveActorInstitutionId(prisma, actor));

    if (institutionId) {
      where.institutionId = institutionId;
    }
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search) {
    where.OR = [
      { nationalId: { contains: query.search, mode: 'insensitive' } },
      { user: { firstName: { contains: query.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: query.search, mode: 'insensitive' } } },
      { user: { email: { contains: query.search, mode: 'insensitive' } } },
    ];
  }

  if (query.courseId && actor.role !== Role.TEACHER) {
    where.enrollments = {
      some: {
        courseId: query.courseId,
        ...(query.academicPeriodId
          ? { academicPeriodId: query.academicPeriodId }
          : {}),
      },
    };
  }

  if (query.excludeEnrolledInPeriodId) {
    where.NOT = {
      enrollments: {
        some: {
          academicPeriodId: query.excludeEnrolledInPeriodId,
          status: EnrollmentStatus.ACTIVE,
        },
      },
    };
  }

  return where;
}

export async function assertActorCanAccessStudent(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  student: { id: string; userId: string; institutionId: string | null },
): Promise<void> {
  if (actor.role === Role.STUDENT) {
    if (student.userId !== actor.id) {
      throw new NotFoundException('Student not found');
    }
    return;
  }

  if (actor.role === Role.TEACHER) {
    if (!actor.profileId) {
      throw new ForbiddenException('Teacher profile is required');
    }

    const hasEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        course: {
          teacherAssignments: {
            some: { teacherId: actor.profileId },
          },
        },
      },
      select: { id: true },
    });

    if (!hasEnrollment) {
      throw new NotFoundException('Student not found');
    }
    return;
  }

  if (actor.role === Role.ADMIN) {
    const institutionId = await resolveActorInstitutionId(prisma, actor);
    if (
      institutionId &&
      student.institutionId &&
      student.institutionId !== institutionId
    ) {
      throw new NotFoundException('Student not found');
    }
  }
}
