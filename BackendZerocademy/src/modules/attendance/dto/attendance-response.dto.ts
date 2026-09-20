import { AttendanceStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AttendanceCourseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  section: string;

  @ApiProperty()
  gradeLevelName: string;
}

export class DailyAttendanceStudentDto {
  @ApiProperty()
  enrollmentId: string;

  @ApiProperty()
  studentId: string;

  @ApiProperty()
  fullName: string;

  @ApiPropertyOptional({ enum: AttendanceStatus, nullable: true })
  status: AttendanceStatus | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;
}

export class DailyAttendanceResponseDto {
  @ApiProperty({ type: AttendanceCourseDto })
  course: AttendanceCourseDto;

  @ApiProperty()
  date: string;

  @ApiProperty()
  isReadOnly: boolean;

  @ApiProperty({ type: [DailyAttendanceStudentDto] })
  students: DailyAttendanceStudentDto[];
}

export class BulkAttendanceResultDto {
  @ApiProperty()
  processed: number;

  @ApiProperty()
  created: number;

  @ApiProperty()
  updated: number;
}
