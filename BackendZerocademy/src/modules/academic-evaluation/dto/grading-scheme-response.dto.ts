import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeScaleResponseDto } from './grade-scale-response.dto';

export class GradingSchemeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  institutionId: string | null;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 0 })
  minScore: number;

  @ApiProperty({ example: 10 })
  maxScore: number;

  @ApiProperty({ example: 7 })
  passingScore: number;

  @ApiProperty({ example: 2 })
  decimalPlaces: number;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: [GradeScaleResponseDto] })
  gradeScales?: GradeScaleResponseDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
