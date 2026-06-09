import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { AssessmentResponseDto } from './assessment-response.dto';

export class AssessmentListResponseDto {
  @ApiProperty({ type: [AssessmentResponseDto] })
  data: AssessmentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
