import { ApiProperty } from '@nestjs/swagger';
import { Weekday } from '@prisma/client';
import { ArrayUnique, IsArray, IsEnum } from 'class-validator';

export class UpdateScheduleStructureDto {
  @ApiProperty({
    enum: Weekday,
    isArray: true,
    example: [Weekday.MON, Weekday.TUE],
  })
  @IsArray()
  @ArrayUnique()
  @IsEnum(Weekday, { each: true })
  enabledWeekdays!: Weekday[];
}
