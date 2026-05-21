import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransitionPeriodSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;
}

export class TransitionCountSummaryDto {
  @ApiProperty({ example: 12 })
  courses: number;

  @ApiProperty({ example: 28 })
  teacherAssignments: number;

  @ApiProperty({ example: 2 })
  terms: number;
}

export class ReusableStructureSummaryDto {
  @ApiProperty({
    description: 'Reusable catalog entries (not duplicated on transition)',
  })
  academicLevels: number;

  @ApiProperty()
  gradeLevels: number;

  @ApiProperty()
  subjects: number;
}

export class AcademicTransitionPreviewResponseDto {
  @ApiProperty({ type: TransitionPeriodSummaryDto })
  fromPeriod: TransitionPeriodSummaryDto;

  @ApiPropertyOptional({ type: TransitionPeriodSummaryDto })
  toPeriod?: TransitionPeriodSummaryDto;

  @ApiPropertyOptional({
    description: 'Target period will be created during execution',
  })
  willCreateTargetPeriod?: boolean;

  @ApiProperty({ type: TransitionCountSummaryDto })
  sourceCounts: TransitionCountSummaryDto;

  @ApiProperty({ type: TransitionCountSummaryDto })
  estimatedCopies: TransitionCountSummaryDto;

  @ApiProperty({ type: ReusableStructureSummaryDto })
  reusableStructures: ReusableStructureSummaryDto;

  @ApiProperty({
    description: 'Levels and grades remain shared; historical periods stay intact',
  })
  structuresReusedNotCopied: boolean;
}
