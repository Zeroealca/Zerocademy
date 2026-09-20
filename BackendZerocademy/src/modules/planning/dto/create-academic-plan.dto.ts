import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateAcademicPlanDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  teacherAssignmentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicTermId: string;

  @ApiProperty({ example: 'Ecuaciones lineales' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectives?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contents?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activities?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resources?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  evaluationNotes?: string;

  @ApiPropertyOptional({ description: 'Notas internas del docente' })
  @IsOptional()
  @IsString()
  notes?: string;
}
