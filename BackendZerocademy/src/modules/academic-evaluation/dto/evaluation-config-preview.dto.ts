import { ApiProperty } from '@nestjs/swagger';
import { AssessmentCategoryResponseDto } from './assessment-category-response.dto';
import { EvaluationTermResponseDto } from './evaluation-term-response.dto';
import { GradingSchemeResponseDto } from './grading-scheme-response.dto';
import { InstitutionAcademicConfigurationResponseDto } from './institution-academic-configuration-response.dto';

export class EvaluationConfigPreviewDto {
  @ApiProperty({ type: InstitutionAcademicConfigurationResponseDto, nullable: true })
  configuration: InstitutionAcademicConfigurationResponseDto | null;

  @ApiProperty({ type: GradingSchemeResponseDto, nullable: true })
  activeGradingScheme: GradingSchemeResponseDto | null;

  @ApiProperty({ type: [EvaluationTermResponseDto] })
  evaluationTerms: EvaluationTermResponseDto[];

  @ApiProperty({ type: [AssessmentCategoryResponseDto] })
  assessmentCategories: AssessmentCategoryResponseDto[];

  @ApiProperty({ example: 100 })
  evaluationTermWeightTotal: number;

  @ApiProperty({ example: 100 })
  assessmentCategoryWeightTotal: number;
}
