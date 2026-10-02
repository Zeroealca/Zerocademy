import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum GradeSheetOperation {
  SET = 'SET',
  CLEAR = 'CLEAR',
}

export class GradeSheetEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ enum: GradeSheetOperation })
  @IsEnum(GradeSheetOperation)
  operation: GradeSheetOperation;

  @ApiPropertyOptional({ example: 8.5, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  score?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string | null;

  @ApiProperty({
    nullable: true,
    description:
      'Server updatedAt from the loaded entry sheet; null when no grade existed.',
  })
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt: string | null;
}

export class BulkUpsertGradesDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assessmentId: string;

  @ApiProperty({ type: [GradeSheetEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => GradeSheetEntryDto)
  entries: GradeSheetEntryDto[];
}
