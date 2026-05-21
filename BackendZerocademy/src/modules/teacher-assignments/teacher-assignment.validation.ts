import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface AssignmentKeys {
  teacherId: string;
  subjectId: string;
  courseId: string;
  academicPeriodId: string;
}

export async function assertTeacherExistsAndActive(
  prisma: PrismaService,
  teacherId: string,
): Promise<void> {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: teacherId },
    include: {
      user: { select: { role: true, isActive: true, deletedAt: true } },
    },
  });

  if (!teacher) {
    throw new NotFoundException('Teacher not found');
  }

  if (
    teacher.user.role !== Role.TEACHER ||
    !teacher.user.isActive ||
    teacher.user.deletedAt
  ) {
    throw new BadRequestException('Teacher account is not active');
  }
}

export async function assertSubjectExistsAndActive(
  prisma: PrismaService,
  subjectId: string,
): Promise<void> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true, isActive: true },
  });

  if (!subject) {
    throw new NotFoundException('Subject not found');
  }

  if (!subject.isActive) {
    throw new BadRequestException('Subject is not active');
  }
}

export async function assertCourseAndPeriodIntegrity(
  prisma: PrismaService,
  courseId: string,
  academicPeriodId: string,
): Promise<{ gradeLevelId: string; institutionId: string | null }> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      isActive: true,
      academicPeriodId: true,
      gradeLevelId: true,
      institutionId: true,
    },
  });

  if (!course) {
    throw new NotFoundException('Course not found');
  }

  if (!course.isActive) {
    throw new BadRequestException('Course is not active');
  }

  if (course.academicPeriodId !== academicPeriodId) {
    throw new BadRequestException(
      'Course does not belong to the selected academic period',
    );
  }

  const period = await prisma.academicPeriod.findUnique({
    where: { id: academicPeriodId },
    select: { id: true },
  });

  if (!period) {
    throw new NotFoundException('Academic period not found');
  }

  return {
    gradeLevelId: course.gradeLevelId,
    institutionId: course.institutionId,
  };
}

export async function assertSubjectAppliesToGrade(
  prisma: PrismaService,
  subjectId: string,
  gradeLevelId: string,
): Promise<void> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { isSystem: true },
  });

  if (!subject) {
    return;
  }

  if (subject.isSystem) {
    return;
  }

  const link = await prisma.subjectGradeLevel.findUnique({
    where: {
      subjectId_gradeLevelId: { subjectId, gradeLevelId },
    },
    select: { id: true },
  });

  if (!link) {
    throw new BadRequestException(
      'Subject is not linked to the grade level of the selected course',
    );
  }
}

export async function assertUniqueAssignment(
  prisma: PrismaService,
  keys: AssignmentKeys,
  excludeId?: string,
): Promise<void> {
  const existing = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: keys.teacherId,
      subjectId: keys.subjectId,
      courseId: keys.courseId,
      academicPeriodId: keys.academicPeriodId,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictException(
      'This teacher is already assigned to this subject for the selected course and period',
    );
  }
}

export function mapPrismaConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'This teacher is already assigned to this subject for the selected course and period',
    );
  }

  throw error;
}
