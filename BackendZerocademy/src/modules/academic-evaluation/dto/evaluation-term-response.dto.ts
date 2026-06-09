import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EvaluationTermResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  institutionId: string;

  @ApiProperty({ format: 'uuid' })
  academicPeriodId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 33.33 })
  weight: number;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  startDate: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  endDate: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
