import { PartialType } from '@nestjs/swagger';
import { CreateEvaluationTermTemplateDto } from './create-evaluation-term-template.dto';

export class UpdateEvaluationTermTemplateDto extends PartialType(
  CreateEvaluationTermTemplateDto,
) {}
