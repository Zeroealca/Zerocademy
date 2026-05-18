import { Prisma } from '@prisma/client';

/**
 * Levels and grades visible to an institution: global catalog (null institution)
 * plus institution-specific custom entries.
 */
export function academicLevelVisibilityFilter(
  institutionId?: string,
): Prisma.AcademicLevelWhereInput {
  if (institutionId) {
    return {
      OR: [{ institutionId: null }, { institutionId }],
    };
  }

  return { institutionId: null };
}

export function gradeLevelVisibilityFilter(
  institutionId?: string,
): Prisma.GradeLevelWhereInput {
  if (institutionId) {
    return {
      OR: [{ institutionId: null }, { institutionId }],
    };
  }

  return { institutionId: null };
}
