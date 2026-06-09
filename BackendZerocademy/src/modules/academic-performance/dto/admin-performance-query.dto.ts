import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PerformanceBaseQueryDto } from './performance-base-query.dto';

export class AdminInstitutionPerformanceQueryDto extends PerformanceBaseQueryDto {
  @ApiPropertyOptional({
    description: 'Institution scope (defaults to actor institution)',
  })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
}

export class AdminCoursePerformanceQueryDto extends PerformanceBaseQueryDto {
  @ApiProperty({ description: 'Course (parallel) identifier' })
  @IsUUID()
  courseId: string;
}

export class AdminStudentPerformanceQueryDto extends PerformanceBaseQueryDto {
  @ApiProperty({ description: 'Student profile identifier' })
  @IsUUID()
  studentId: string;

  @ApiPropertyOptional({ description: 'Optional course scope' })
  @IsOptional()
  @IsUUID()
  courseId?: string;
}
