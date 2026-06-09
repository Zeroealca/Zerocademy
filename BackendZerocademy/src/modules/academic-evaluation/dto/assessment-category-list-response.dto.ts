import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { AssessmentCategoryResponseDto } from './assessment-category-response.dto';

export class AssessmentCategoryListResponseDto {
  @ApiProperty({ type: [AssessmentCategoryResponseDto] })
  data: AssessmentCategoryResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
