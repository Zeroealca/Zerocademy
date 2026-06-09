import { ApiProperty } from '@nestjs/swagger';
import { RoundingStrategy } from '@prisma/client';
import { AssessmentCategoryTemplateResponseDto } from './assessment-category-template-response.dto';
import { EvaluationTermTemplateResponseDto } from './evaluation-term-template-response.dto';
import { GradingSchemeResponseDto } from './grading-scheme-response.dto';

export class PlatformAcademicEvaluationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ format: 'uuid' })
  gradingSchemeId: string;

  @ApiProperty({ enum: RoundingStrategy })
  roundingStrategy: RoundingStrategy;

  @ApiProperty({ example: 2 })
  decimalPlaces: number;

  @ApiProperty({ type: GradingSchemeResponseDto })
  gradingScheme: GradingSchemeResponseDto;

  @ApiProperty({ type: [AssessmentCategoryTemplateResponseDto] })
  assessmentCategoryTemplates: AssessmentCategoryTemplateResponseDto[];

  @ApiProperty({ type: [EvaluationTermTemplateResponseDto] })
  evaluationTermTemplates: EvaluationTermTemplateResponseDto[];

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
