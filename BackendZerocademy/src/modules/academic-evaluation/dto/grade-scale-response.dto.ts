import { ApiProperty } from '@nestjs/swagger';

export class GradeScaleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  gradingSchemeId: string;

  @ApiProperty({ example: 'DAR' })
  code: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ example: 9 })
  minValue: number;

  @ApiProperty({ example: 10 })
  maxValue: number;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
