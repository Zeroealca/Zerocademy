import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAssessmentCategoryDto } from './create-assessment-category.dto';

export class UpdateAssessmentCategoryDto extends PartialType(
  OmitType(CreateAssessmentCategoryDto, ['institutionId'] as const),
) {}
