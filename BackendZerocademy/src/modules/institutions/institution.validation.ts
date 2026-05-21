import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicRegime,
  Institution,
  InstitutionRegion,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const CODE_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6})$/;

export function normalizeInstitutionCode(code: string): string {
  return code.trim().toLowerCase();
}

export function assertValidInstitutionCode(code: string): void {
  const normalized = normalizeInstitutionCode(code);

  if (!CODE_PATTERN.test(normalized)) {
    throw new BadRequestException(
      'Institution code must be 3–50 lowercase alphanumeric characters (hyphens allowed, not at edges)',
    );
  }
}

export async function assertUniqueInstitutionCode(
  prisma: PrismaService,
  code: string,
  excludeId?: string,
): Promise<void> {
  const normalizedCode = normalizeInstitutionCode(code);

  const existing = await prisma.institution.findFirst({
    where: {
      code: normalizedCode,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictException('An institution with this code already exists');
  }
}

export function assertValidHexColor(
  value: string | undefined | null,
  field: string,
): void {
  if (value === undefined || value === null || value === '') {
    return;
  }

  if (!HEX_COLOR_PATTERN.test(value)) {
    throw new BadRequestException(
      `${field} must be a valid hex color (e.g. #1E40AF)`,
    );
  }
}

export function assertRegionRegimeConsistency(
  region?: InstitutionRegion | null,
  regime?: AcademicRegime | null,
): void {
  if (!region || !regime) {
    return;
  }

  const costaGalapagosRegions: InstitutionRegion[] = [
    InstitutionRegion.COSTA,
    InstitutionRegion.GALAPAGOS,
  ];
  const sierraAmazoniaRegions: InstitutionRegion[] = [
    InstitutionRegion.SIERRA,
    InstitutionRegion.AMAZONIA,
  ];

  if (
    regime === AcademicRegime.COSTA_GALAPAGOS &&
    !costaGalapagosRegions.includes(region)
  ) {
    throw new BadRequestException(
      'Region is not compatible with the Costa/Galápagos academic regime',
    );
  }

  if (
    regime === AcademicRegime.SIERRA_AMAZONIA &&
    !sierraAmazoniaRegions.includes(region)
  ) {
    throw new BadRequestException(
      'Region is not compatible with the Sierra/Amazonía academic regime',
    );
  }
}

export async function findActiveInstitutionOrThrow(
  prisma: PrismaService,
  institutionId: string,
): Promise<Institution> {
  const institution = await prisma.institution.findUnique({
    where: { id: institutionId },
  });

  if (!institution) {
    throw new NotFoundException('Institution not found');
  }

  if (!institution.isActive) {
    throw new BadRequestException(
      'Academic operations require an active institution',
    );
  }

  return institution;
}

export function buildInstitutionListWhere(
  query: {
    search?: string;
    region?: InstitutionRegion;
    regime?: AcademicRegime;
    isActive?: boolean;
  },
): Prisma.InstitutionWhereInput {
  const where: Prisma.InstitutionWhereInput = {};

  if (query.region) {
    where.region = query.region;
  }

  if (query.regime) {
    where.regime = query.regime;
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search?.trim()) {
    const term = query.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { code: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  return where;
}
