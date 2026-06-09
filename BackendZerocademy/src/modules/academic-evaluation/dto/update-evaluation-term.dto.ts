import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateEvaluationTermDto } from './create-evaluation-term.dto';

export class UpdateEvaluationTermDto extends PartialType(
  OmitType(CreateEvaluationTermDto, ['institutionId', 'academicPeriodId'] as const),
) {}
