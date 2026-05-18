import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'First Grade — Morning' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'A', description: 'Parallel / section identifier within the grade' })
  @IsString()
  @MinLength(1)
  @MaxLength(16)
  section: string;

  @ApiPropertyOptional({ example: 35, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  academicPeriodId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  gradeLevelId: string;
}
