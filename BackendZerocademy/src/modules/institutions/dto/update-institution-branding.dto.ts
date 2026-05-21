import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateInstitutionBrandingDto {
  @ApiPropertyOptional({
    example: '/uploads/institutions/uuid/logo.webp',
    description: 'Set via logo upload endpoint; optional manual override',
  })
  @IsOptional()
  @IsString()
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
