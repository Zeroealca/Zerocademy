import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export async function assertUniqueGradeLevelCode(
  prisma: PrismaService,
  academicLevelId: string,
  code: string,
  excludeId?: string,
): Promise<void> {
  const normalizedCode = normalizeAcademicCode(code);

  const existing = await prisma.gradeLevel.findFirst({
    where: {
      academicLevelId,
      code: normalizedCode,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictException(
      'A grade level with this code already exists for the academic level',
    );
  }
}

export function normalizeAcademicCode(code: string): string {
  return code.trim().toUpperCase();
}

export function assertSystemLevelRules(
  isSystem: boolean,
  institutionId?: string | null,
): void {
  if (isSystem && institutionId) {
    throw new BadRequestException(
      'System grade levels cannot be tied to an institution',
    );
  }
}

export async function assertParentAcademicLevelExists(
  prisma: PrismaService,
  academicLevelId: string,
): Promise<void> {
  const level = await prisma.academicLevel.findUnique({
    where: { id: academicLevelId },
    select: { id: true, isActive: true },
  });

  if (!level) {
    throw new NotFoundException('Academic level not found');
  }

  if (!level.isActive) {
    throw new BadRequestException(
      'Cannot assign a grade level to an inactive academic level',
    );
  }
}

export async function assertSubLevelBelongsToAcademicLevel(
  prisma: PrismaService,
  subLevelId: string,
  academicLevelId: string,
): Promise<void> {
  const subLevel = await prisma.subLevel.findUnique({
    where: { id: subLevelId },
    select: { academicLevelId: true, isActive: true },
  });

  if (!subLevel) {
    throw new NotFoundException('Sublevel not found');
  }
  if (!subLevel.isActive) {
    throw new BadRequestException(
      'Cannot assign a grade to an inactive sublevel',
    );
  }
  if (subLevel.academicLevelId !== academicLevelId) {
    throw new BadRequestException(
      'The selected sublevel does not belong to the academic level',
    );
  }
}
