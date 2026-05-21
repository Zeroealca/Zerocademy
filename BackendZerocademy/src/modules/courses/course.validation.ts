import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AcademicPeriod, GradeLevel } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { findActiveInstitutionOrThrow } from '../institutions/institution.validation';

export function normalizeCourseSection(section: string): string {
  return section.trim().toUpperCase();
}

export async function assertAcademicPeriodExists(
  prisma: PrismaService,
  academicPeriodId: string,
): Promise<AcademicPeriod> {
  const period = await prisma.academicPeriod.findUnique({
    where: { id: academicPeriodId },
  });

  if (!period) {
    throw new NotFoundException('Academic period not found');
  }

  if (period.institutionId) {
    await findActiveInstitutionOrThrow(prisma, period.institutionId);
  }

  return period;
}

export async function assertGradeLevelExistsAndActive(
  prisma: PrismaService,
  gradeLevelId: string,
): Promise<GradeLevel> {
  const grade = await prisma.gradeLevel.findUnique({
    where: { id: gradeLevelId },
  });

  if (!grade) {
    throw new NotFoundException('Grade level not found');
  }

  if (!grade.isActive) {
    throw new BadRequestException('Grade level must be active to assign a course');
  }

  return grade;
}

export async function assertUniqueCourseSection(
  prisma: PrismaService,
  params: {
    academicPeriodId: string;
    gradeLevelId: string;
    section: string;
  },
  excludeCourseId?: string,
): Promise<void> {
  const section = normalizeCourseSection(params.section);

  const existing = await prisma.course.findFirst({
    where: {
      academicPeriodId: params.academicPeriodId,
      gradeLevelId: params.gradeLevelId,
      section,
      ...(excludeCourseId ? { NOT: { id: excludeCourseId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictException(
      'A course with this section already exists for the selected period and grade',
    );
  }
}
