import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { GradeLevelResponseDto } from './grade-level-response.dto';

export class GradeLevelListResponseDto {
  @ApiProperty({ type: [GradeLevelResponseDto] })
  data: GradeLevelResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
