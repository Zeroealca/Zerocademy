import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicRegime } from '@prisma/client';
import { AcademicPeriodResponseDto } from './academic-period-response.dto';

export class ActivePeriodByRegimeDto {
  @ApiProperty({ enum: AcademicRegime })
  regime: AcademicRegime;

  @ApiPropertyOptional({ type: AcademicPeriodResponseDto, nullable: true })
  period: AcademicPeriodResponseDto | null;
}

export class AcademicPeriodContextResponseDto {
  @ApiPropertyOptional({
    type: AcademicPeriodResponseDto,
    description: 'User-selected period (persisted)',
  })
  selectedPeriod: AcademicPeriodResponseDto | null;

  @ApiPropertyOptional({
    type: AcademicPeriodResponseDto,
    description: 'Resolved period used for queries (selected or default active)',
  })
  effectivePeriod: AcademicPeriodResponseDto | null;

  @ApiProperty({
    type: [ActivePeriodByRegimeDto],
    description: 'Globally active period per regime (at most one ACTIVE each)',
  })
  activeByRegime: ActivePeriodByRegimeDto[];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Institution scope when applicable',
  })
  institutionId?: string;
}
