import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleBlockKind, Weekday } from '@prisma/client';

export enum ScheduleStructureValidationStatus {
  NO_ENABLED_WEEKDAYS = 'NO_ENABLED_WEEKDAYS',
  NO_TEACHING_BLOCKS = 'NO_TEACHING_BLOCKS',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
  OVERLAPPING_BLOCKS = 'OVERLAPPING_BLOCKS',
  DUPLICATE_POSITION = 'DUPLICATE_POSITION',
}

export enum ScheduleStructureIssueSeverity {
  ERROR = 'ERROR',
  INFO = 'INFO',
}

export class ScheduleBlockResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() position!: number;
  @ApiPropertyOptional() name!: string | null;
  @ApiProperty({ example: '07:00' }) startTime!: string;
  @ApiProperty({ example: '07:40' }) endTime!: string;
  @ApiProperty({ enum: ScheduleBlockKind }) kind!: ScheduleBlockKind;
}

export class ScheduleStructureResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() academicPeriodId!: string;
  @ApiProperty({ enum: Weekday, isArray: true }) enabledWeekdays!: Weekday[];
  @ApiProperty({ type: () => [ScheduleBlockResponseDto] })
  blocks!: ScheduleBlockResponseDto[];
}

export class ScheduleStructureIssueDto {
  @ApiProperty({ enum: ScheduleStructureValidationStatus })
  status!: ScheduleStructureValidationStatus;
  @ApiProperty({ enum: ScheduleStructureIssueSeverity })
  severity!: ScheduleStructureIssueSeverity;
  @ApiProperty() message!: string;
  @ApiPropertyOptional() scheduleBlockId!: string | null;
}

export class ScheduleStructureValidationResponseDto {
  @ApiProperty() structurallyReady!: boolean;
  @ApiProperty({ type: () => [ScheduleStructureIssueDto] })
  issues!: ScheduleStructureIssueDto[];
}

export class ScheduleCapacitySummaryDto {
  @ApiProperty({ enum: Weekday, isArray: true }) enabledWeekdays!: Weekday[];
  @ApiProperty() teachingBlocksPerConfiguredDay!: number;
  @ApiProperty() weeklyTeachingSlotsPerCourse!: number;
  @ApiProperty() breakBlocksPerConfiguredDay!: number;
  @ApiProperty() nonTeachingBlocksPerConfiguredDay!: number;
  @ApiProperty() structurallyReady!: boolean;
}

export class ScheduleStructureDetailResponseDto extends ScheduleStructureResponseDto {
  @ApiProperty({ type: () => ScheduleCapacitySummaryDto })
  capacity!: ScheduleCapacitySummaryDto;
}
