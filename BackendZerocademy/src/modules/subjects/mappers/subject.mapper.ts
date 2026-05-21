import { GradeLevel, Subject, SubjectGradeLevel } from '@prisma/client';
import { SubjectResponseDto } from '../dto/subject-response.dto';

type SubjectWithGradeLinks = Subject & {
  gradeLevelLinks?: (SubjectGradeLevel & { gradeLevel: GradeLevel })[];
};

export function toSubjectResponseDto(subject: SubjectWithGradeLinks): SubjectResponseDto {
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description,
    institutionId: subject.institutionId,
    isSystem: subject.isSystem,
    isActive: subject.isActive,
    gradeLevels: subject.gradeLevelLinks?.map((link) => ({
      id: link.gradeLevel.id,
      code: link.gradeLevel.code,
      name: link.gradeLevel.name,
    })),
    createdAt: subject.createdAt.toISOString(),
    updatedAt: subject.updatedAt.toISOString(),
  };
}

export const subjectWithGradeLinksInclude = {
  gradeLevelLinks: {
    include: { gradeLevel: true },
    orderBy: { gradeLevel: { order: 'asc' as const } },
  },
} as const;
