import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicRegime, InstitutionRegion } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateInstitutionDto {
  @ApiProperty({ example: 'Colegio San Francisco' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: 'colegio-san-francisco',
    description: 'Unique institution identifier (lowercase, hyphens allowed)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  code: string;

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

  @ApiPropertyOptional({ example: 'https://cdn.example.edu/logo.png' })
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#1E40AF' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  primaryColor?: string;

  @ApiPropertyOptional({ example: '#F59E0B' })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  secondaryColor?: string;
}
