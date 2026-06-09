import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateGradeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessmentId: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ example: 8.5, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  score: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;
}
