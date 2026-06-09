import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class BulkGradeEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ example: 8.5, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  score: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;
}

export class BulkUpsertGradesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessmentId: string;

  @ApiProperty({ type: [BulkGradeEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BulkGradeEntryDto)
  grades: BulkGradeEntryDto[];
}
