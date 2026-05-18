import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AcademicPeriodStatus,
  AcademicRegime,
} from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListAcademicPeriodsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: AcademicRegime })
  @IsOptional()
  @IsEnum(AcademicRegime)
  regime?: AcademicRegime;

  @ApiPropertyOptional({ enum: AcademicPeriodStatus })
  @IsOptional()
  @IsEnum(AcademicPeriodStatus)
  status?: AcademicPeriodStatus;

  @ApiPropertyOptional({
    description: 'Search by period name',
    example: '2025',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
