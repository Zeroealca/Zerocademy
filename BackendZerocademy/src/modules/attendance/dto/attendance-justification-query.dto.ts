import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceJustificationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class AttendanceJustificationQueryDto {
  @ApiPropertyOptional({ enum: AttendanceJustificationStatus })
  @IsOptional()
  @IsEnum(AttendanceJustificationStatus)
  status?: AttendanceJustificationStatus;
}
