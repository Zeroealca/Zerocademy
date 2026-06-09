import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssessmentResponseDto } from './assessment-response.dto';

export class GradeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  assessmentId: string;

  @ApiProperty({ format: 'uuid' })
  enrollmentId: string;

  @ApiProperty({ format: 'uuid' })
  studentId: string;

  @ApiProperty()
  studentFirstName: string;

  @ApiProperty()
  studentLastName: string;

  @ApiProperty()
  score: number;

  @ApiPropertyOptional()
  observations: string | null;

  @ApiPropertyOptional({ format: 'uuid' })
  gradingSchemeId: string | null;

  @ApiProperty({ type: AssessmentResponseDto })
  assessment: AssessmentResponseDto;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
