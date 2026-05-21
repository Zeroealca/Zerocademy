import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AcademicPeriodStatus,
  AcademicRegime,
} from '@prisma/client';
import { AcademicTermResponseDto } from './academic-term-response.dto';

export class AcademicPeriodResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: '2025-2026' })
  name: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Owning educational institution',
  })
  institutionId?: string | null;

  @ApiProperty({ enum: AcademicRegime })
  regime: AcademicRegime;

  @ApiProperty({ example: '2025-04-01' })
  startDate: string;

  @ApiProperty({ example: '2026-02-28' })
  endDate: string;

  @ApiProperty({ example: false })
  isActive: boolean;

  @ApiProperty({ enum: AcademicPeriodStatus })
  status: AcademicPeriodStatus;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  @ApiPropertyOptional({ type: [AcademicTermResponseDto] })
  terms?: AcademicTermResponseDto[];
}
