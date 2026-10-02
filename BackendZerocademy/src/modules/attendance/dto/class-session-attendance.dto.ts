import { AttendanceStatus, ClassSessionStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ClassSessionAttendanceEntryDto {
  @ApiProperty({ format: 'uuid' })
  enrollmentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  status: AttendanceStatus | null;

  @ApiPropertyOptional({ nullable: true })
  note: string | null;
}

export class ClassSessionAttendanceSessionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ enum: ClassSessionStatus })
  status: ClassSessionStatus;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  scheduledDate: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  occurredOn: string | null;
}

export class ClassSessionAttendanceRosterDto {
  @ApiProperty({ type: ClassSessionAttendanceSessionDto })
  classSession: ClassSessionAttendanceSessionDto;

  @ApiProperty()
  isReadOnly: boolean;

  @ApiProperty({ type: [ClassSessionAttendanceEntryDto] })
  records: Array<
    ClassSessionAttendanceEntryDto & {
      studentId: string;
      firstName: string;
      lastName: string;
    }
  >;
}

export class ReplaceClassSessionAttendanceEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ enum: AttendanceStatus })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ nullable: true, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}

export class ReplaceClassSessionAttendanceDto {
  @ApiProperty({ type: [ReplaceClassSessionAttendanceEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ReplaceClassSessionAttendanceEntryDto)
  records: ReplaceClassSessionAttendanceEntryDto[];
}
