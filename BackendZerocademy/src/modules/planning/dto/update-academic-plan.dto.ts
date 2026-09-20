import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateAcademicPlanDto } from './create-academic-plan.dto';

/** The teaching assignment is immutable once a draft is created. */
export class UpdateAcademicPlanDto extends PartialType(
  OmitType(CreateAcademicPlanDto, ['teacherAssignmentId'] as const),
) {}
