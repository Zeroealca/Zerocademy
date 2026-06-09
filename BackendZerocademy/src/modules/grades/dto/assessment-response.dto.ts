import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssessmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  institutionId: string;

  @ApiProperty({ format: 'uuid' })
  academicPeriodId: string;

  @ApiProperty()
  academicPeriodName: string;

  @ApiProperty({ format: 'uuid' })
  academicTermId: string;

  @ApiProperty()
  academicTermName: string;

  @ApiProperty()
  academicTermOrder: number;

  @ApiProperty({ format: 'uuid' })
  subjectId: string;

  @ApiProperty()
  subjectName: string;

  @ApiProperty()
  subjectCode: string;

  @ApiProperty({ format: 'uuid' })
  teacherAssignmentId: string;

  @ApiProperty({ format: 'uuid' })
  courseId: string;

  @ApiProperty({ format: 'uuid' })
  assessmentCategoryId: string;

  @ApiProperty()
  assessmentCategoryName: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  maxScore: number;

  @ApiProperty()
  weight: number;

  @ApiProperty({ format: 'date' })
  assessmentDate: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
