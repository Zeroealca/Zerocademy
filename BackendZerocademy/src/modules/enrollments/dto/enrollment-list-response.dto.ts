import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { EnrollmentResponseDto } from './enrollment-response.dto';

export class EnrollmentListResponseDto {
  @ApiProperty({ type: [EnrollmentResponseDto] })
  data: EnrollmentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
