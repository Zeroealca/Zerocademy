import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAcademicLevelDto {
  @ApiProperty({ example: 'Educación General Básica' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'EGB', description: 'Unique code within scope' })
  @IsString()
  @MaxLength(32)
  code: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional({ example: 'Basic general education stage' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Null for global catalog entries',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'System-wide reusable level (no institution)',
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
