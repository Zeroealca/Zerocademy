import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoundingStrategy } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class UpsertPlatformAcademicEvaluationDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  gradingSchemeId?: string;

  @ApiPropertyOptional({ enum: RoundingStrategy })
  @IsOptional()
  @IsEnum(RoundingStrategy)
  roundingStrategy?: RoundingStrategy;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  decimalPlaces?: number;
}
