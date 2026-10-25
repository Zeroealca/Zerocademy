import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Weekday } from '@prisma/client';
import { IsOptional, IsUUID } from 'class-validator';

export class TeacherTimetableQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}

export class TeacherTimetableSlotResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() teacherAssignmentId!: string;
  @ApiProperty({ enum: Weekday }) weekday!: Weekday;
  @ApiProperty() scheduleBlockId!: string;
  @ApiProperty() scheduleBlockPosition!: number;
  @ApiProperty() scheduleBlockStartTime!: string;
  @ApiProperty() scheduleBlockEndTime!: string;
  @ApiProperty() courseId!: string;
  @ApiProperty() courseName!: string;
  @ApiProperty() subjectName!: string;
}

export class TeacherTimetableResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() academicPeriodId!: string;
  @ApiProperty() academicPeriodName!: string;
  @ApiProperty({ type: [TeacherTimetableSlotResponseDto] })
  slots!: TeacherTimetableSlotResponseDto[];
}

export class TeacherTimetableListResponseDto {
  @ApiProperty({ type: [TeacherTimetableResponseDto] })
  data!: TeacherTimetableResponseDto[];
}
