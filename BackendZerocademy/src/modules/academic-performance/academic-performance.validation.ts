import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

export async function assertActorCanAccessInstitution(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  institutionId: string,
): Promise<void> {
  if (RoleUtils.isSuperAdmin(actor.role)) {
    return;
  }

  const actorInstitutionId = await resolveActorInstitutionId(prisma, actor);

  if (actor.role === Role.ADMIN) {
    if (actorInstitutionId && actorInstitutionId !== institutionId) {
      throw new NotFoundException('Institution not found');
    }
    return;
  }

  if (actor.role === Role.TEACHER && actor.profileId) {
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        institutionId,
        teacherId: actor.profileId,
      },
      select: { id: true },
    });

    if (assignment) {
      return;
    }
  }

  if (actor.role === Role.STUDENT && actor.profileId) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: actor.profileId,
        course: { institutionId },
        status: EnrollmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (enrollment) {
      return;
    }
  }

  throw new NotFoundException('Institution not found');
}

export async function assertTeacherCanAccessCourse(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  courseId: string,
  academicPeriodId: string,
): Promise<{ institutionId: string; courseName: string }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      name: true,
      section: true,
      institutionId: true,
      academicPeriodId: true,
    },
  });

  if (!course?.institutionId || course.academicPeriodId !== academicPeriodId) {
    throw new NotFoundException('Course not found');
  }

  if (RoleUtils.isSuperAdmin(actor.role) || actor.role === Role.ADMIN) {
    await assertActorCanAccessInstitution(
      prisma,
      actor,
      course.institutionId,
    );
    return {
      institutionId: course.institutionId,
      courseName: `${course.name} ${course.section}`,
    };
  }

  if (actor.role !== Role.TEACHER || !actor.profileId) {
    throw new ForbiddenException('Course access denied');
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      courseId,
      academicPeriodId,
      teacherId: actor.profileId,
    },
    select: { id: true },
  });

  if (!assignment) {
    throw new NotFoundException('Course not found');
  }

  return {
    institutionId: course.institutionId,
    courseName: `${course.name} ${course.section}`,
  };
}

export async function assertTeacherOwnsSubjectInCourse(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  courseId: string,
  subjectId: string,
  academicPeriodId: string,
): Promise<{ institutionId: string; subjectName: string }> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { name: true, institutionId: true },
  });

  if (!subject) {
    throw new NotFoundException('Subject not found');
  }

  if (RoleUtils.isSuperAdmin(actor.role) || actor.role === Role.ADMIN) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { institutionId: true, academicPeriodId: true },
    });

    if (
      !course?.institutionId ||
      course.academicPeriodId !== academicPeriodId
    ) {
      throw new NotFoundException('Course not found');
    }

    await assertActorCanAccessInstitution(
      prisma,
      actor,
      course.institutionId,
    );

    return {
      institutionId: course.institutionId,
      subjectName: subject.name,
    };
  }

  if (actor.role !== Role.TEACHER || !actor.profileId) {
    throw new ForbiddenException('Subject access denied');
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      courseId,
      subjectId,
      academicPeriodId,
      teacherId: actor.profileId,
    },
    select: { institutionId: true },
  });

  if (!assignment?.institutionId) {
    throw new NotFoundException('Subject not found in course');
  }

  return {
    institutionId: assignment.institutionId,
    subjectName: subject.name,
  };
}

export async function resolveStudentEnrollment(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  academicPeriodId: string,
  studentId?: string,
  courseId?: string,
): Promise<{
  enrollmentId: string;
  studentId: string;
  institutionId: string;
  studentName: string;
}> {
  if (actor.role === Role.STUDENT) {
    if (!actor.profileId) {
      throw new ForbiddenException('Student profile not found');
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: actor.profileId,
        academicPeriodId,
        status: EnrollmentStatus.ACTIVE,
        ...(courseId ? { courseId } : {}),
      },
      include: {
        student: {
          select: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
        course: { select: { institutionId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment?.course.institutionId) {
      throw new NotFoundException('Active enrollment not found');
    }

    return {
      enrollmentId: enrollment.id,
      studentId: enrollment.studentId,
      institutionId: enrollment.course.institutionId,
      studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
    };
  }

  if (!studentId) {
    throw new NotFoundException('Student not found');
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      studentId,
      academicPeriodId,
      status: EnrollmentStatus.ACTIVE,
      ...(courseId ? { courseId } : {}),
    },
    include: {
      student: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
      course: { select: { institutionId: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!enrollment?.course.institutionId) {
    throw new NotFoundException('Student enrollment not found');
  }

  return {
    enrollmentId: enrollment.id,
    studentId: enrollment.studentId,
    institutionId: enrollment.course.institutionId,
    studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
  };
}
