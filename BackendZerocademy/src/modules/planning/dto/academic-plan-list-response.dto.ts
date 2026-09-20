import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { AcademicPlanResponseDto } from './academic-plan-response.dto';

export class AcademicPlanListResponseDto {
  @ApiProperty({ type: [AcademicPlanResponseDto] })
  data: AcademicPlanResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
