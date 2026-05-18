import { ApiProperty } from '@nestjs/swagger';
import { AcademicRegime } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ActivePeriodQueryDto {
  @ApiProperty({ enum: AcademicRegime })
  @IsEnum(AcademicRegime)
  regime: AcademicRegime;
}
