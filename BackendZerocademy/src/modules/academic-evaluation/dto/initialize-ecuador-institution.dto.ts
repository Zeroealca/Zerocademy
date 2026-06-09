import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreateAssessmentCategoryDto } from './create-assessment-category.dto';
import { CreateEvaluationTermDto } from './create-evaluation-term.dto';

export class InitializeEcuadorInstitutionDto {
  @ApiPropertyOptional({
    description:
      'Optional evaluation terms to seed for the active academic period',
    type: [CreateEvaluationTermDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEvaluationTermDto)
  evaluationTerms?: CreateEvaluationTermDto[];

  @ApiPropertyOptional({
    description: 'Optional assessment categories with weights',
    type: [CreateAssessmentCategoryDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAssessmentCategoryDto)
  assessmentCategories?: CreateAssessmentCategoryDto[];
}
