import { ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicRegime, InstitutionRegion } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateInstitutionSettingsDto {
  @ApiPropertyOptional({ example: 'contacto@colegio.edu.ec' })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({ example: '+593 99 000 0000' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @ApiPropertyOptional({ example: 'Av. Principal 123, Quito' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ enum: InstitutionRegion })
  @IsOptional()
  @IsEnum(InstitutionRegion)
  region?: InstitutionRegion;

  @ApiPropertyOptional({ enum: AcademicRegime })
  @IsOptional()
  @IsEnum(AcademicRegime)
  regime?: AcademicRegime;
}
