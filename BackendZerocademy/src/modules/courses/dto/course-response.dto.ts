import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CourseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ example: 'A' })
  section: string;

  @ApiPropertyOptional({ nullable: true })
  capacity?: number | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  institutionId?: string | null;

  @ApiProperty({ format: 'uuid' })
  academicPeriodId: string;

  @ApiProperty({ format: 'uuid' })
  gradeLevelId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
