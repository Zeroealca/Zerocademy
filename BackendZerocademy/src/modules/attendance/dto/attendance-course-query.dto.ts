import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AttendanceCourseQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;
}
