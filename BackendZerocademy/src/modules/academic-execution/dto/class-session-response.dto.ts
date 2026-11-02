import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClassSession, ClassSessionStatus } from '@prisma/client';

export class ClassSessionResponseDto {
  static from(value: ClassSession): ClassSessionResponseDto {
    return {
      ...value,
      scheduledDate: value.scheduledDate?.toISOString().slice(0, 10) ?? null,
      occurredOn: value.occurredOn?.toISOString().slice(0, 10) ?? null,
      originBlockStartTime: value.originBlockStartTime
        ? ClassSessionResponseDto.time(value.originBlockStartTime)
        : null,
      originBlockEndTime: value.originBlockEndTime
        ? ClassSessionResponseDto.time(value.originBlockEndTime)
        : null,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
    };
  }
  private static time(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) teacherAssignmentId: string;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) lessonPlanId:
    | string
    | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) timetableSlotId:
    | string
    | null;
  @ApiPropertyOptional({ nullable: true }) timetableOccurrenceKey:
    | string
    | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  originTeacherAssignmentId: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) originInstitutionId:
    | string
    | null;
  @ApiPropertyOptional({ nullable: true }) originInstitutionName: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  originAcademicPeriodId: string | null;
  @ApiPropertyOptional({ nullable: true }) originAcademicPeriodName:
    | string
    | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) originCourseId:
    | string
    | null;
  @ApiPropertyOptional({ nullable: true }) originCourseName: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) originSubjectId:
    | string
    | null;
  @ApiPropertyOptional({ nullable: true }) originSubjectName: string | null;
  @ApiPropertyOptional({ nullable: true }) originWeekday: string | null;
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  originScheduleBlockId: string | null;
  @ApiPropertyOptional({ nullable: true }) originBlockStartTime: string | null;
  @ApiPropertyOptional({ nullable: true }) originBlockEndTime: string | null;
  @ApiProperty({ enum: ClassSessionStatus }) status: ClassSessionStatus;
  @ApiPropertyOptional({ format: 'date', nullable: true }) scheduledDate:
    | string
    | null;
  @ApiPropertyOptional({ format: 'date', nullable: true }) occurredOn:
    | string
    | null;
  @ApiProperty({ format: 'date-time' }) createdAt: string;
  @ApiProperty({ format: 'date-time' }) updatedAt: string;
}

export class OpenClassSessionFromTimetableSlotResponseDto {
  @ApiProperty({ type: ClassSessionResponseDto })
  classSession!: ClassSessionResponseDto;
  @ApiProperty()
  created!: boolean;
}
