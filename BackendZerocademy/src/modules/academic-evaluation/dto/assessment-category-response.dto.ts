import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssessmentCategoryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  institutionId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 40 })
  weight: number;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
