import { ApiProperty } from '@nestjs/swagger';
import { TransitionPeriodSummaryDto } from './academic-transition-preview-response.dto';

export class AcademicTransitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  institutionId: string;

  @ApiProperty({ type: TransitionPeriodSummaryDto })
  fromPeriod: TransitionPeriodSummaryDto;

  @ApiProperty({ type: TransitionPeriodSummaryDto })
  toPeriod: TransitionPeriodSummaryDto;

  @ApiProperty({ format: 'uuid' })
  executedById: string;

  @ApiProperty()
  copiedCourses: boolean;

  @ApiProperty()
  copiedAssignments: boolean;

  @ApiProperty()
  copiedStructures: boolean;

  @ApiProperty()
  copiedTerms: boolean;

  @ApiProperty()
  createdAt: string;
}
