import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { GradingSchemeResponseDto } from './grading-scheme-response.dto';

export class GradingSchemeListResponseDto {
  @ApiProperty({ type: [GradingSchemeResponseDto] })
  data: GradingSchemeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
