import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum JustificationReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}
export class CreateAttendanceJustificationDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
export class ReviewAttendanceJustificationDto {
  @ApiProperty({ enum: JustificationReviewDecision })
  @IsEnum(JustificationReviewDecision)
  decision: JustificationReviewDecision;
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
