import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepresentativeRelationshipType } from '@prisma/client';

export class RepresentativeStudentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  representativeUserId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty({ enum: RepresentativeRelationshipType })
  relationshipType: RepresentativeRelationshipType;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({
    description:
      'Student display name (portal). Prefer representativeFullName on admin lists.',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Representative display name for administrator relationship lists',
  })
  representativeFullName?: string;

  @ApiPropertyOptional({
    description: 'Representative email for administrator relationship lists',
  })
  representativeEmail?: string;

  @ApiPropertyOptional()
  academicPeriodId?: string;

  @ApiPropertyOptional()
  academicPeriodName?: string;

  @ApiPropertyOptional()
  gradeLevelName?: string;

  @ApiPropertyOptional()
  courseName?: string;

  @ApiPropertyOptional()
  section?: string;
}
