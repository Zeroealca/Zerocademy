import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AcademicRegime, InstitutionRegion } from '@prisma/client';

export class InstitutionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Colegio San Francisco' })
  name: string;

  @ApiProperty({ example: 'colegio-san-francisco' })
  code: string;

  @ApiPropertyOptional({ example: 'contacto@colegio.edu.ec' })
  email?: string | null;

  @ApiPropertyOptional({ example: '+593 99 000 0000' })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'Av. Principal 123, Quito' })
  address?: string | null;

  @ApiPropertyOptional({ enum: InstitutionRegion })
  region?: InstitutionRegion | null;

  @ApiPropertyOptional({ enum: AcademicRegime })
  regime?: AcademicRegime | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.edu/logo.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: '#1E40AF' })
  primaryColor?: string | null;

  @ApiPropertyOptional({ example: '#F59E0B' })
  secondaryColor?: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
