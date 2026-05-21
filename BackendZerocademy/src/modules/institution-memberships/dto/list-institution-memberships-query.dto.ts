import { ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionMembershipRole } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListInstitutionMembershipsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InstitutionMembershipRole })
  @IsOptional()
  @IsEnum(InstitutionMembershipRole)
  role?: InstitutionMembershipRole;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by member name or email' })
  @IsOptional()
  @IsString()
  search?: string;
}
