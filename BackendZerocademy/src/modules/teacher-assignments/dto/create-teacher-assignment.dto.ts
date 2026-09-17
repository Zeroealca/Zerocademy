import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional } from 'class-validator';

export class CreateTeacherAssignmentDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  institutionId?: string;
  @ApiProperty({ format: 'uuid', description: 'Teacher profile id' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;
}
