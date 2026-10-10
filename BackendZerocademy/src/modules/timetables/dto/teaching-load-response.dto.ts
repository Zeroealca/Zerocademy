import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OfficialStudyPlanValuePolicy } from '@prisma/client';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';

export enum TeachingLoadValidationStatus {
  VALID = 'VALID',
  UNCONFIGURED = 'UNCONFIGURED',
  BELOW_OFFICIAL_MINIMUM = 'BELOW_OFFICIAL_MINIMUM',
  FIXED_VALUE_MISMATCH = 'FIXED_VALUE_MISMATCH',
  MISSING_REQUIRED_SUBJECT = 'MISSING_REQUIRED_SUBJECT',
  NO_TEACHER_ASSIGNMENT = 'NO_TEACHER_ASSIGNMENT',
  CUSTOM_SUBJECT = 'CUSTOM_SUBJECT',
  NO_OFFICIAL_REFERENCE = 'NO_OFFICIAL_REFERENCE',
}

export enum TeachingLoadValidationSeverity {
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export class OfficialTeachingLoadReferenceDto {
  @ApiPropertyOptional() studyPlanId!: string | null;
  @ApiPropertyOptional() studyPlanCode!: string | null;
  @ApiPropertyOptional() studyPlanVersion!: string | null;
  @ApiPropertyOptional({ enum: OfficialStudyPlanValuePolicy })
  valuePolicy!: OfficialStudyPlanValuePolicy | null;
  @ApiPropertyOptional() defaultWeeklyPeriods!: number | null;
  @ApiPropertyOptional() minimumWeeklyPeriods!: number | null;
  @ApiPropertyOptional() sourceReference!: string | null;
  @ApiPropertyOptional() sourceUrl!: string | null;
  @ApiProperty() outsideVerifiedCatalog!: boolean;
}

export class TeachingLoadIssueDto {
  @ApiProperty({ enum: TeachingLoadValidationStatus })
  status!: TeachingLoadValidationStatus;
  @ApiProperty({ enum: TeachingLoadValidationSeverity })
  severity!: TeachingLoadValidationSeverity;
  @ApiProperty() message!: string;
  @ApiPropertyOptional() teacherAssignmentId!: string | null;
  @ApiPropertyOptional() courseId!: string | null;
  @ApiPropertyOptional() subjectId!: string | null;
  @ApiPropertyOptional() allocationGroupId!: string | null;
}

export class TeachingLoadResponseDto {
  @ApiProperty() teacherAssignmentId!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() academicPeriodId!: string;
  @ApiProperty() courseId!: string;
  @ApiProperty() courseName!: string;
  @ApiProperty() gradeLevelId!: string;
  @ApiProperty() gradeLevelCode!: string;
  @ApiProperty() subjectId!: string;
  @ApiProperty() subjectCode!: string;
  @ApiProperty() subjectName!: string;
  @ApiProperty() teacherId!: string;
  @ApiProperty() teacherName!: string;
  @ApiPropertyOptional() weeklyPeriods!: number | null;
  @ApiProperty({ type: () => OfficialTeachingLoadReferenceDto })
  officialReference!: OfficialTeachingLoadReferenceDto;
  @ApiProperty({ enum: TeachingLoadValidationStatus })
  validationStatus!: TeachingLoadValidationStatus;
  @ApiProperty({ type: () => [TeachingLoadIssueDto] })
  issues!: TeachingLoadIssueDto[];
}

export class TeachingLoadListResponseDto {
  @ApiProperty({ type: () => [TeachingLoadResponseDto] })
  data!: TeachingLoadResponseDto[];
  @ApiProperty({ type: () => PaginationMetaDto }) meta!: PaginationMetaDto;
}

export class TeachingLoadValidationResponseDto {
  @ApiProperty() configurationReady!: boolean;
  @ApiProperty({ type: () => [TeachingLoadIssueDto] })
  issues!: TeachingLoadIssueDto[];
}
