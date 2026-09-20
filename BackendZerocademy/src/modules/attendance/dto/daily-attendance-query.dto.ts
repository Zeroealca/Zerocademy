import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsUUID, Matches } from 'class-validator';

export class DailyAttendanceQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  courseId: string;

  @ApiProperty({
    example: '2026-09-18',
    description: 'School-local calendar date',
  })
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;
}
