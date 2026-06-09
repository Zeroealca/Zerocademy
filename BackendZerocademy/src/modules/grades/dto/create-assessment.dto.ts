import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAssessmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  institutionId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicTermId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teacherAssignmentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessmentCategoryId: string;

  @ApiProperty({ example: 'Unit 1 Exam' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 10, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  maxScore: number;

  @ApiProperty({ example: 20, minimum: 0.01, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  weight: number;

  @ApiProperty({ example: '2026-03-15', format: 'date' })
  @IsDateString()
  assessmentDate: string;
}
