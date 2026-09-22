import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  Min,
} from 'class-validator';

export class CreateLessonPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  lessonDate: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  objectives?: string;

  @IsOptional()
  @IsString()
  introduction?: string;

  @IsOptional()
  @IsString()
  development?: string;

  @IsOptional()
  @IsString()
  closure?: string;

  @IsOptional()
  @IsString()
  resources?: string;

  @IsOptional()
  @IsString()
  evaluationStrategy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLessonPlanDto extends PartialType(CreateLessonPlanDto) {}

export class ReorderLessonPlansDto {
  @IsArray()
  @IsUUID('4', { each: true })
  lessonPlanIds: string[];
}
