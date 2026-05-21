import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubjectGradeLevelRefDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'G8' })
  code: string;

  @ApiProperty({ example: 'Eighth Grade' })
  name: string;
}

export class SubjectResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Mathematics' })
  name: string;

  @ApiProperty({ example: 'MATH' })
  code: string;

  @ApiPropertyOptional({ example: 'Core mathematics curriculum' })
  description?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Owning institution (null = global catalog)',
  })
  institutionId?: string | null;

  @ApiProperty({ example: false })
  isSystem: boolean;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ type: [SubjectGradeLevelRefDto] })
  gradeLevels?: SubjectGradeLevelRefDto[];

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
