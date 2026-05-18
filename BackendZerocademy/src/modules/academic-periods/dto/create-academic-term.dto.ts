import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateAcademicTermDto {
  @ApiProperty({ example: 'First Quimester' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  order: number;

  @ApiProperty({ example: '2025-04-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-07-31' })
  @IsDateString()
  endDate: string;
}
