import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoundingStrategy } from '@prisma/client';
import { GradingSchemeResponseDto } from './grading-scheme-response.dto';

export class InstitutionAcademicConfigurationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  institutionId: string;

  @ApiProperty({ format: 'uuid' })
  gradingSchemeId: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  activeAcademicPeriodId: string | null;

  @ApiProperty({ enum: RoundingStrategy })
  roundingStrategy: RoundingStrategy;

  @ApiProperty({ example: 2 })
  decimalPlaces: number;

  @ApiPropertyOptional({ type: GradingSchemeResponseDto })
  gradingScheme?: GradingSchemeResponseDto;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
