import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { AcademicLevelResponseDto } from './academic-level-response.dto';

export class AcademicLevelListResponseDto {
  @ApiProperty({ type: [AcademicLevelResponseDto] })
  data: AcademicLevelResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
