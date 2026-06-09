import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpsertInstitutionAcademicConfigurationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gradingSchemeId: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  activeAcademicPeriodId?: string;

  @ApiPropertyOptional({ enum: RoundingStrategy, default: RoundingStrategy.ROUND_HALF_UP })
  @IsOptional()
  @IsEnum(RoundingStrategy)
  roundingStrategy?: RoundingStrategy;

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  decimalPlaces?: number;
}
