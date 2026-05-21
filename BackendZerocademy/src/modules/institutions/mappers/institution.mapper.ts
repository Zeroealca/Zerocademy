import { Institution } from '@prisma/client';
import { InstitutionResponseDto } from '../dto/institution-response.dto';

export function toInstitutionResponseDto(
  institution: Institution,
): InstitutionResponseDto {
  return {
    id: institution.id,
    name: institution.name,
    code: institution.code,
    email: institution.email,
    phone: institution.phone,
    address: institution.address,
    region: institution.region,
    regime: institution.regime,
    logoUrl: institution.logoUrl,
    primaryColor: institution.primaryColor,
    secondaryColor: institution.secondaryColor,
    isActive: institution.isActive,
    createdAt: institution.createdAt.toISOString(),
    updatedAt: institution.updatedAt.toISOString(),
  };
}
