import { ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicRegime, InstitutionRegion } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ListInstitutionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: InstitutionRegion })
  @IsOptional()
  @IsEnum(InstitutionRegion)
  region?: InstitutionRegion;

  @ApiPropertyOptional({ enum: AcademicRegime })
  @IsOptional()
  @IsEnum(AcademicRegime)
  regime?: AcademicRegime;

  @ApiPropertyOptional({ description: 'Filter by active flag' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name, code, or email',
    example: 'colegio',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
