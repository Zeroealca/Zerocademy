import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateGradeScaleDto {
  @ApiProperty({ example: 'DAR' })
  @IsString()
  @MinLength(1)
  code: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  description: string;

  @ApiProperty({ example: 9 })
  @Type(() => Number)
  @IsNumber()
  minValue: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  maxValue: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  order: number;
}
