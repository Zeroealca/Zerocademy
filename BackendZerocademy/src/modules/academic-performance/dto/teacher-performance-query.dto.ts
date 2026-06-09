import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PerformanceBaseQueryDto } from './performance-base-query.dto';

export class TeacherCourseAveragesQueryDto extends PerformanceBaseQueryDto {
  @ApiProperty({ description: 'Course (parallel) identifier' })
  @IsUUID()
  courseId: string;
}

export class TeacherSubjectPerformanceQueryDto extends PerformanceBaseQueryDto {
  @ApiProperty({ description: 'Course (parallel) identifier' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: 'Subject identifier' })
  @IsUUID()
  subjectId: string;
}

export class TeacherStudentPerformanceQueryDto extends PerformanceBaseQueryDto {
  @ApiProperty({ description: 'Student profile identifier' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: 'Optional course scope' })
  @IsOptional()
  @IsUUID()
  courseId?: string;
}
