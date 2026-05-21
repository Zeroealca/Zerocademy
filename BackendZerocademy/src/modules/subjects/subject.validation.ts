import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export function normalizeSubjectCode(code: string): string {
  return code.trim().toUpperCase();
}

export async function assertUniqueSubjectCode(
  prisma: PrismaService,
  code: string,
  institutionId?: string | null,
  excludeId?: string,
): Promise<void> {
  const normalizedCode = normalizeSubjectCode(code);

  const existing = await prisma.subject.findFirst({
    where: {
      code: normalizedCode,
      institutionId: institutionId ?? null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictException('A subject with this code already exists');
  }
}

export function assertSystemSubjectRules(
  isSystem: boolean,
  institutionId?: string | null,
  gradeLevelIds?: string[],
): void {
  if (isSystem && institutionId) {
    throw new BadRequestException('System subjects cannot belong to an institution');
  }

  if (isSystem && gradeLevelIds && gradeLevelIds.length > 0) {
    throw new BadRequestException(
      'System subjects cannot be restricted to specific grade levels at creation',
    );
  }
}

export async function assertGradeLevelsExist(
  prisma: PrismaService,
  gradeLevelIds: string[],
): Promise<void> {
  if (gradeLevelIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(gradeLevelIds)];
  const count = await prisma.gradeLevel.count({
    where: { id: { in: uniqueIds }, isActive: true },
  });

  if (count !== uniqueIds.length) {
    throw new BadRequestException(
      'One or more grade levels were not found or are inactive',
    );
  }
}
