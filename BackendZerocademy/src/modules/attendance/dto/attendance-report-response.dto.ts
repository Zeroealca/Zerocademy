import {
  AttendanceJustificationStatus,
  AttendanceStatus,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceCourseDto } from './attendance-response.dto';

export class AttendanceCountsDto {
  @ApiProperty() recordedDays: number;
  @ApiProperty() present: number;
  @ApiProperty() absent: number;
  @ApiProperty() late: number;
  @ApiProperty() excused: number;
  @ApiPropertyOptional({ nullable: true }) attendancePercentage: number | null;
}
export class AttendanceHistoryItemDto {
  @ApiProperty() id: string;
  @ApiProperty() date: string;
  @ApiProperty({ enum: AttendanceStatus }) status: AttendanceStatus;
  @ApiPropertyOptional({ nullable: true }) notes: string | null;
  @ApiProperty() courseName: string;
  @ApiPropertyOptional({ nullable: true })
  pendingJustification: {
    id: string;
    status: AttendanceJustificationStatus;
  } | null;
}
export class MyAttendanceHistoryResponseDto {
  @ApiProperty({ type: AttendanceCountsDto }) summary: AttendanceCountsDto;
  @ApiProperty({ type: [AttendanceHistoryItemDto] })
  records: AttendanceHistoryItemDto[];
}
export class CourseAttendanceStudentSummaryDto extends AttendanceCountsDto {
  @ApiProperty() enrollmentId: string;
  @ApiProperty() fullName: string;
}
export class CourseAttendanceReportDto {
  @ApiProperty({ type: AttendanceCourseDto }) course: AttendanceCourseDto;
  @ApiProperty() academicPeriodName: string;
  @ApiProperty() startDate: string;
  @ApiProperty() endDate: string;
  @ApiProperty({ type: [CourseAttendanceStudentSummaryDto] })
  students: CourseAttendanceStudentSummaryDto[];
}
