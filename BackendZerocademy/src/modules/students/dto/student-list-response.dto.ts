import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { StudentResponseDto } from './student-response.dto';

export class StudentListResponseDto {
  @ApiProperty({ type: [StudentResponseDto] })
  data: StudentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
