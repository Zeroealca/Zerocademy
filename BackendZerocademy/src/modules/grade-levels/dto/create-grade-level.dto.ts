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

export class CreateGradeLevelDto {
  @ApiProperty({ example: 'Primer Grado' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'G1',
    description: 'Unique code within the parent academic level',
  })
  @IsString()
  @MaxLength(32)
  code: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiPropertyOptional({ example: 'First grade of basic education' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ format: 'uuid', description: 'Parent academic level' })
  @IsUUID()
  academicLevelId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Null for global catalog entries',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'System-wide reusable grade (no institution)',
  })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;
}
