import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TimetableStatus, Weekday } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { TimetableConflictValidationResult } from '../timetable-conflict.types';
import type {
  TimetableGenerationDiagnostic,
  TimetableGenerationStatistics,
  TimetableGenerationStatus,
} from '../timetable-generation.types';

export class TimetableSlotInputDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() teacherAssignmentId!: string;
  @ApiProperty({ enum: Weekday }) @IsEnum(Weekday) weekday!: Weekday;
  @ApiProperty({ format: 'uuid' }) @IsUUID() scheduleBlockId!: string;
}

export class CreateTimetableDto {
  @ApiProperty({ type: [TimetableSlotInputDto] })
  @IsArray()
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => TimetableSlotInputDto)
  slots!: TimetableSlotInputDto[];
}

export class ReplaceTimetableSlotsDto extends CreateTimetableDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) expectedVersion!: number;
}

/** The lifecycle transition is guarded by the same optimistic version used for slot edits. */
export class TransitionTimetableDto {
  @ApiProperty({ minimum: 1 }) @IsInt() @Min(1) expectedVersion!: number;
}

export class GenerateTimetableDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 1000000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000000)
  maxSearchNodes?: number;
}

export class TimetableSlotResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() teacherAssignmentId!: string;
  @ApiProperty() teacherId!: string;
  @ApiProperty() courseId!: string;
  @ApiProperty({ enum: Weekday }) weekday!: Weekday;
  @ApiProperty() scheduleBlockId!: string;
  @ApiProperty() scheduleBlockPosition!: number;
  @ApiProperty() scheduleBlockStartTime!: string;
  @ApiProperty() scheduleBlockEndTime!: string;
  @ApiProperty() courseName!: string;
  @ApiProperty() subjectName!: string;
  @ApiProperty() teacherName!: string;
}

export class TimetableResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() academicPeriodId!: string;
  @ApiProperty({ enum: TimetableStatus }) status!: TimetableStatus;
  @ApiProperty() version!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
  @ApiPropertyOptional({ format: 'date-time' }) publishedAt!: Date | null;
  @ApiPropertyOptional({ format: 'uuid' }) publishedByUserId!: string | null;
  @ApiProperty({ type: [TimetableSlotResponseDto] })
  slots!: TimetableSlotResponseDto[];
}

export class TimetableListResponseDto {
  @ApiProperty({ type: [TimetableResponseDto] }) data!: TimetableResponseDto[];
}

export class TimetableGenerationResponseDto {
  @ApiProperty() status!: TimetableGenerationStatus;
  @ApiProperty({ type: [TimetableSlotInputDto] })
  slots!: TimetableSlotInputDto[];
  @ApiProperty() diagnostics!: TimetableGenerationDiagnostic[];
  @ApiProperty() validation!: TimetableConflictValidationResult | null;
  @ApiProperty() statistics!: TimetableGenerationStatistics;
}

export class TimetableValidationResponseDto {
  @ApiProperty() valid!: boolean;
  @ApiProperty() mode!: string;
  @ApiProperty() conflicts!: TimetableConflictValidationResult['conflicts'];
}
