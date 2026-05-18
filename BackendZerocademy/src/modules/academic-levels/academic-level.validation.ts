import { BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export async function assertUniqueAcademicLevelCode(
  prisma: PrismaService,
  code: string,
  institutionId: string | null | undefined,
  excludeId?: string,
): Promise<void> {
  const normalizedCode = code.trim().toUpperCase();

  const existing = await prisma.academicLevel.findFirst({
    where: {
      code: normalizedCode,
      institutionId: institutionId ?? null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictException(
      'An academic level with this code already exists for the given scope',
    );
  }
}

export function normalizeAcademicCode(code: string): string {
  return code.trim().toUpperCase();
}

export function assertSystemLevelRules(isSystem: boolean, institutionId?: string | null): void {
  if (isSystem && institutionId) {
    throw new BadRequestException(
      'System academic levels cannot be tied to an institution',
    );
  }
}
