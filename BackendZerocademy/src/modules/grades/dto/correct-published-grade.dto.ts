import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum PublishedGradeCorrectionOperation {
  SET = 'SET',
  CLEAR = 'CLEAR',
}

export class CorrectPublishedGradeDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Frozen assessment roster enrollment.',
  })
  @IsUUID()
  enrollmentId: string;

  @ApiProperty({ enum: PublishedGradeCorrectionOperation })
  @IsEnum(PublishedGradeCorrectionOperation)
  operation: PublishedGradeCorrectionOperation;

  @ApiPropertyOptional({ minimum: 0 })
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
    maxLength: 2000,
    description:
      'Required, non-blank explanation for the published-grade correction.',
  })
  @IsString()
  @MaxLength(2000)
  reason: string;

  @ApiProperty({
    nullable: true,
    description:
      'Current Grade updatedAt, or null when the frozen roster member has no Grade.',
  })
  @IsOptional()
  @IsDateString()
  expectedUpdatedAt: string | null;
}
