import { ApiProperty } from '@nestjs/swagger';

export class TeacherAssignmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  teacherId: string;

  @ApiProperty({ example: 'Ada' })
  teacherFirstName: string;

  @ApiProperty({ example: 'Lovelace' })
  teacherLastName: string;

  @ApiProperty({ format: 'uuid' })
  subjectId: string;

  @ApiProperty({ example: 'Mathematics' })
  subjectName: string;

  @ApiProperty({ example: 'MATH' })
  subjectCode: string;

  @ApiProperty({ format: 'uuid' })
  courseId: string;

  @ApiProperty({ example: '8vo A' })
  courseName: string;

  @ApiProperty({ format: 'uuid' })
  academicPeriodId: string;

  @ApiProperty({ example: '2025-2026' })
  academicPeriodName: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
