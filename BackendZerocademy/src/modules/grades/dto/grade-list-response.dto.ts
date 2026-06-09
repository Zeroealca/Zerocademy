import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { GradeResponseDto } from './grade-response.dto';

export class GradeListResponseDto {
  @ApiProperty({ type: [GradeResponseDto] })
  data: GradeResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
