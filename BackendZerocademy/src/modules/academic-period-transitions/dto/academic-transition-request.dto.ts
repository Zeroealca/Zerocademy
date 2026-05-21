import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicRegime } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TransitionOptionsDto } from './transition-options.dto';

export class CreateTargetPeriodInTransitionDto {
  @ApiProperty({ example: '2026-2027' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AcademicRegime })
  @IsEnum(AcademicRegime)
  regime: AcademicRegime;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-02-28' })
  @IsDateString()
  endDate: string;
}

export class AcademicTransitionRequestDto {
  @ApiProperty({ format: 'uuid', description: 'Source academic period' })
  @IsUUID()
  fromAcademicPeriodId: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Existing target period (omit when creating a new one)',
  })
  @IsOptional()
  @IsUUID()
  toAcademicPeriodId?: string;

  @ApiPropertyOptional({
    description: 'Create a new target period as part of the transition',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTargetPeriodInTransitionDto)
  createTargetPeriod?: CreateTargetPeriodInTransitionDto;

  @ApiProperty({ type: TransitionOptionsDto })
  @ValidateNested()
  @Type(() => TransitionOptionsDto)
  options: TransitionOptionsDto;
}
