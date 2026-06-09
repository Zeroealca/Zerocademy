import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentResponseDto } from './assessment-response.dto';

export class GradeEntryRowDto {
  @ApiProperty({ format: 'uuid' })
  enrollmentId: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty()
  studentFirstName: string;

  @ApiProperty()
  studentLastName: string;

  @ApiPropertyOptional({ format: 'uuid' })
  gradeId: string | null;

  @ApiPropertyOptional()
  score: number | null;

  @ApiPropertyOptional()
  observations: string | null;
}

export class GradeEntrySheetResponseDto {
  @ApiProperty({ type: AssessmentResponseDto })
  assessment: AssessmentResponseDto;

  @ApiProperty()
  gradingSchemeMinScore: number;

  @ApiProperty()
  gradingSchemeMaxScore: number;

  @ApiProperty()
  decimalPlaces: number;

  @ApiProperty({ type: [GradeEntryRowDto] })
  rows: GradeEntryRowDto[];
}
