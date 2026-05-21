import { AcademicPeriod, AcademicTerm } from '@prisma/client';
import { AcademicPeriodResponseDto } from '../dto/academic-period-response.dto';
import { AcademicTermResponseDto } from '../dto/academic-term-response.dto';

type AcademicPeriodWithTerms = AcademicPeriod & {
  terms?: AcademicTerm[];
};

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toAcademicTermResponseDto(
  term: AcademicTerm,
): AcademicTermResponseDto {
  return {
    id: term.id,
    name: term.name,
    order: term.order,
    startDate: formatDateOnly(term.startDate),
    endDate: formatDateOnly(term.endDate),
    academicPeriodId: term.academicPeriodId,
    createdAt: term.createdAt.toISOString(),
    updatedAt: term.updatedAt.toISOString(),
  };
}

export function toAcademicPeriodResponseDto(
  period: AcademicPeriodWithTerms,
  includeTerms = false,
): AcademicPeriodResponseDto {
  const response: AcademicPeriodResponseDto = {
    id: period.id,
    name: period.name,
    institutionId: period.institutionId,
    regime: period.regime,
    startDate: formatDateOnly(period.startDate),
    endDate: formatDateOnly(period.endDate),
    isActive: period.isActive,
    status: period.status,
    createdAt: period.createdAt.toISOString(),
    updatedAt: period.updatedAt.toISOString(),
  };

  if (includeTerms && period.terms) {
    response.terms = period.terms
      .sort((a, b) => a.order - b.order)
      .map(toAcademicTermResponseDto);
  }

  return response;
}

export const academicPeriodWithTermsInclude = {
  terms: {
    orderBy: { order: 'asc' as const },
  },
} as const;
