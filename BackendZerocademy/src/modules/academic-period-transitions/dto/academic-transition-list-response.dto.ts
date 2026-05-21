import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { AcademicTransitionResponseDto } from './academic-transition-response.dto';

export class AcademicTransitionListResponseDto {
  @ApiProperty({ type: [AcademicTransitionResponseDto] })
  data: AcademicTransitionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
