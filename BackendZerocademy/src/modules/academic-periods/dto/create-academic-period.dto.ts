import { ApiProperty } from '@nestjs/swagger';
import { AcademicRegime } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAcademicPeriodDto {
  @ApiProperty({ example: '2025-2026' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ enum: AcademicRegime, example: AcademicRegime.COSTA_GALAPAGOS })
  @IsEnum(AcademicRegime)
  regime: AcademicRegime;

  @ApiProperty({ example: '2025-04-01', description: 'Inclusive start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-02-28', description: 'Inclusive end date (YYYY-MM-DD)' })
  @IsDateString()
  endDate: string;
}
