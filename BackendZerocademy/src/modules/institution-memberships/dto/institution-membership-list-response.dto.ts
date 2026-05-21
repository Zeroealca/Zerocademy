import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../../common/dto/swagger/pagination-meta.dto';
import { InstitutionMembershipResponseDto } from './institution-membership-response.dto';

export class InstitutionMembershipListResponseDto {
  @ApiProperty({ type: [InstitutionMembershipResponseDto] })
  data: InstitutionMembershipResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
