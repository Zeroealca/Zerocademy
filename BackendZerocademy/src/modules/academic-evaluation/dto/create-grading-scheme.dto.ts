import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGradingSchemeDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Null for global template' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;

  @ApiProperty({ example: 'Custom 0–100 scale' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 0 })
  @Type(() => Number)
  @IsNumber()
  minScore: number;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  maxScore: number;

  @ApiProperty({ example: 70 })
  @Type(() => Number)
  @IsNumber()
  passingScore: number;

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  decimalPlaces?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
