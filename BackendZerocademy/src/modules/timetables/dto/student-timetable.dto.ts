import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Weekday } from '@prisma/client';
import { IsOptional, IsUUID } from 'class-validator';

export class StudentTimetableQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  academicPeriodId?: string;
}

export class RepresentativeTimetableQueryDto extends StudentTimetableQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studentId!: string;
}

export class StudentTimetableSlotResponseDto {
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
  @ApiPropertyOptional() teacherName?: string;
}

export class StudentTimetableResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() institutionId!: string;
  @ApiProperty() academicPeriodId!: string;
  @ApiProperty() academicPeriodName!: string;
  @ApiProperty({ type: [StudentTimetableSlotResponseDto] })
  slots!: StudentTimetableSlotResponseDto[];
}

export class StudentTimetableListResponseDto {
  @ApiProperty({ type: [StudentTimetableResponseDto] })
  data!: StudentTimetableResponseDto[];
}
