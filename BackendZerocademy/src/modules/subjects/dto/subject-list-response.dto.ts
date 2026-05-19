import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { SubjectResponseDto } from './subject-response.dto';

export class SubjectListResponseDto {
  @ApiProperty({ type: [SubjectResponseDto] })
  data: SubjectResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
