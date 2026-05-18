import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { AcademicPeriodResponseDto } from './academic-period-response.dto';

export class AcademicPeriodListResponseDto {
  @ApiProperty({ type: [AcademicPeriodResponseDto] })
  data: AcademicPeriodResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
