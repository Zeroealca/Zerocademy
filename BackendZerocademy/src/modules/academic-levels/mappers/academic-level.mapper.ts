import { AcademicLevel } from '@prisma/client';
import { AcademicLevelResponseDto } from '../dto/academic-level-response.dto';

export function toAcademicLevelResponseDto(
  level: AcademicLevel,
): AcademicLevelResponseDto {
  return {
    id: level.id,
    name: level.name,
    code: level.code,
    order: level.order,
    description: level.description ?? undefined,
    institutionId: level.institutionId,
    isSystem: level.isSystem,
    isActive: level.isActive,
    createdAt: level.createdAt.toISOString(),
    updatedAt: level.updatedAt.toISOString(),
  };
}
