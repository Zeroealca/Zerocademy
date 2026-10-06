import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  OfficialStudyPlanStatus,
  OfficialStudyPlanValuePolicy,
} from '@prisma/client';

export class OfficialStudyPlanEntryResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() gradeLevelId!: string;
  @ApiProperty() gradeLevelCode!: string;
  @ApiProperty() subjectId!: string;
  @ApiProperty() subjectCode!: string;
  @ApiProperty({ enum: OfficialStudyPlanValuePolicy })
  valuePolicy!: OfficialStudyPlanValuePolicy;
  @ApiPropertyOptional() defaultWeeklyPeriods!: number | null;
  @ApiPropertyOptional() minimumWeeklyPeriods!: number | null;
  @ApiPropertyOptional() allocationGroupId!: string | null;
  @ApiProperty() sourceLocator!: string;
}

export class OfficialStudyPlanAllocationGroupResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() gradeLevelId!: string;
  @ApiProperty() gradeLevelCode!: string;
  @ApiProperty() key!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: OfficialStudyPlanValuePolicy })
  valuePolicy!: OfficialStudyPlanValuePolicy;
  @ApiPropertyOptional() defaultWeeklyPeriods!: number | null;
  @ApiPropertyOptional() minimumWeeklyPeriods!: number | null;
  @ApiProperty() sourceLocator!: string;
}

export class OfficialStudyPlanResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() code!: string;
  @ApiProperty() version!: string;
  @ApiProperty() name!: string;
  @ApiProperty() applicabilityKey!: string;
  @ApiProperty() sourceTitle!: string;
  @ApiProperty() sourceReference!: string;
  @ApiProperty() sourceUrl!: string;
  @ApiProperty({ type: String, format: 'date' }) issuedOn!: string;
  @ApiProperty({ type: String, format: 'date' }) effectiveFrom!: string;
  @ApiPropertyOptional({ type: String, format: 'date' }) effectiveTo!: string | null;
  @ApiProperty({ enum: OfficialStudyPlanStatus }) status!: OfficialStudyPlanStatus;
  @ApiProperty({ type: () => [OfficialStudyPlanEntryResponseDto] }) entries!: OfficialStudyPlanEntryResponseDto[];
  @ApiProperty({ type: () => [OfficialStudyPlanAllocationGroupResponseDto] }) allocationGroups!: OfficialStudyPlanAllocationGroupResponseDto[];
}

export class InstitutionStudyPlanAdoptionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() academicPeriodId!: string;
  @ApiProperty() officialStudyPlanId!: string;
  @ApiProperty() applicabilityKey!: string;
  @ApiProperty() adoptedByUserId!: string;
  @ApiProperty({ type: String, format: 'date-time' }) adoptedAt!: string;
}
