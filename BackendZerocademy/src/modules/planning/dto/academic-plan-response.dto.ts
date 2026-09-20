import { AcademicPlanStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcademicPlanResponseDto {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) teacherAssignmentId: string;
  @ApiProperty({ format: 'uuid' }) academicPeriodId: string;
  @ApiProperty() academicPeriodName: string;
  @ApiProperty() academicPeriodStatus: string;
  @ApiProperty({ format: 'uuid' }) academicTermId: string;
  @ApiProperty() academicTermName: string;
  @ApiProperty() academicTermOrder: number;
  @ApiProperty({ format: 'uuid' }) courseId: string;
  @ApiProperty() courseName: string;
  @ApiProperty() courseSection: string;
  @ApiProperty({ format: 'uuid' }) subjectId: string;
  @ApiProperty() subjectName: string;
  @ApiProperty() subjectCode: string;
  @ApiProperty({ format: 'uuid' }) teacherId: string;
  @ApiProperty() teacherFirstName: string;
  @ApiProperty() teacherLastName: string;
  @ApiProperty() title: string;
  @ApiPropertyOptional() description: string | null;
  @ApiPropertyOptional({ format: 'date' }) startDate: string | null;
  @ApiPropertyOptional({ format: 'date' }) endDate: string | null;
  @ApiPropertyOptional() objectives: string | null;
  @ApiPropertyOptional() contents: string | null;
  @ApiPropertyOptional() activities: string | null;
  @ApiPropertyOptional() resources: string | null;
  @ApiPropertyOptional() evaluationNotes: string | null;
  @ApiPropertyOptional() notes: string | null;
  @ApiProperty({ enum: AcademicPlanStatus }) status: AcademicPlanStatus;
  @ApiProperty({ format: 'uuid' }) createdByUserId: string;
  @ApiPropertyOptional({ format: 'date-time' }) publishedAt: string | null;
  @ApiPropertyOptional({ format: 'uuid' }) publishedByUserId: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}
