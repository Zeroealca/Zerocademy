import { GradeLevel } from '@prisma/client';
import { GradeLevelResponseDto } from '../dto/grade-level-response.dto';

export function toGradeLevelResponseDto(
  grade: GradeLevel,
): GradeLevelResponseDto {
  return {
    id: grade.id,
    name: grade.name,
    code: grade.code,
    order: grade.order,
    description: grade.description ?? undefined,
    academicLevelId: grade.academicLevelId,
    institutionId: grade.institutionId,
    isSystem: grade.isSystem,
    isActive: grade.isActive,
    createdAt: grade.createdAt.toISOString(),
    updatedAt: grade.updatedAt.toISOString(),
  };
}
