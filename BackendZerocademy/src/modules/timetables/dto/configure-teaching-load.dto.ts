import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class ConfigureTeachingLoadDto {
  @ApiProperty({ example: 6, minimum: 1 })
  @IsInt()
  @Min(1)
  weeklyPeriods!: number;
}
