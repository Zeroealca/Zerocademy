import { PartialType } from '@nestjs/swagger';
import { CreateAssessmentCategoryTemplateDto } from './create-assessment-category-template.dto';

export class UpdateAssessmentCategoryTemplateDto extends PartialType(
  CreateAssessmentCategoryTemplateDto,
) {}
