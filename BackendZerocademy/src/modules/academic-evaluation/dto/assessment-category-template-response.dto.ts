import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssessmentCategoryTemplateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 40 })
  weight: number;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
