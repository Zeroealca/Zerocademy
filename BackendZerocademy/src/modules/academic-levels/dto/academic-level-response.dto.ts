import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcademicLevelResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  order: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  institutionId?: string | null;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
