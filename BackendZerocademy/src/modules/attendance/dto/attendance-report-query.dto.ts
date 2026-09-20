import { AttendanceStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';

export class AttendanceReportQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() academicPeriodId: string;
  @ApiProperty({ format: 'uuid' }) @IsUUID() courseId: string;
  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;
  @ApiProperty({ example: '2026-09-30' })
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate: string;
}

export class MyAttendanceHistoryQueryDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() academicPeriodId: string;
  @ApiPropertyOptional({ example: '2026-09-01' })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;
  @ApiPropertyOptional({ example: '2026-09-30' })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;
}
