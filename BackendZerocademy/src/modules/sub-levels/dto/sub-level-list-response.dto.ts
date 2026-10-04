import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { SubLevelResponseDto } from './sub-level-response.dto';
export class SubLevelListResponseDto {
  @ApiProperty({ type: [SubLevelResponseDto] }) data: SubLevelResponseDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta: PaginationMetaDto;
}
