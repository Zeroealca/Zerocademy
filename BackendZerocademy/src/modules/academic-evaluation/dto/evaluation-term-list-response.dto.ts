import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { EvaluationTermResponseDto } from './evaluation-term-response.dto';

export class EvaluationTermListResponseDto {
  @ApiProperty({ type: [EvaluationTermResponseDto] })
  data: EvaluationTermResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
