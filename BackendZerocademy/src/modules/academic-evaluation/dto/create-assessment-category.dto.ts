import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateAssessmentCategoryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  institutionId: string;

  @ApiProperty({ example: 'Exams' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsNumber()
  weight: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
