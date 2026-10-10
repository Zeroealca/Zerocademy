import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleBlockKind } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const TIME_ONLY_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

export class CreateScheduleBlockDto {
  @ApiPropertyOptional({ maxLength: 120, example: 'First period' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ example: '07:00' })
  @Matches(TIME_ONLY_PATTERN, {
    message: 'startTime must be a local HH:mm or HH:mm:ss value',
  })
  startTime!: string;

  @ApiProperty({ example: '07:40' })
  @Matches(TIME_ONLY_PATTERN, {
    message: 'endTime must be a local HH:mm or HH:mm:ss value',
  })
  endTime!: string;

  @ApiProperty({ enum: ScheduleBlockKind })
  @IsEnum(ScheduleBlockKind)
  kind!: ScheduleBlockKind;
}

export class UpdateScheduleBlockDto extends PartialType(
  CreateScheduleBlockDto,
) {}
