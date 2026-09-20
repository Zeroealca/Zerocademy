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

  @ApiProperty()
  fullName: string;

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
