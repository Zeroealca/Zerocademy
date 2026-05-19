import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { TeacherAssignmentResponseDto } from './teacher-assignment-response.dto';

export class TeacherAssignmentListResponseDto {
  @ApiProperty({ type: [TeacherAssignmentResponseDto] })
  data: TeacherAssignmentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
