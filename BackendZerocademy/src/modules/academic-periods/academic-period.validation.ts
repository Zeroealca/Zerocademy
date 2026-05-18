import { BadRequestException } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicRegime,
} from '@prisma/client';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface TermRange extends DateRange {
  order: number;
  name: string;
}

export function assertValidPeriodDates(range: DateRange): void {
  if (range.startDate >= range.endDate) {
    throw new BadRequestException('startDate must be before endDate');
  }
}

export function assertTermWithinPeriod(
  period: DateRange,
  term: DateRange,
  termLabel = 'Term',
): void {
  if (term.startDate >= term.endDate) {
    throw new BadRequestException(`${termLabel}: startDate must be before endDate`);
  }

  if (term.startDate < period.startDate || term.endDate > period.endDate) {
    throw new BadRequestException(
      `${termLabel} dates must fall within the academic period range`,
    );
  }
}

export function assertTermsOrderUnique(terms: { order: number }[]): void {
  const orders = terms.map((term) => term.order);
  const unique = new Set(orders);

  if (unique.size !== orders.length) {
    throw new BadRequestException('Term order values must be unique within a period');
  }
}

export function assertTermsDoNotOverlap(terms: TermRange[]): void {
  const sorted = [...terms].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime(),
  );

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (current.startDate <= previous.endDate) {
      throw new BadRequestException(
        `Terms "${previous.name}" and "${current.name}" have overlapping dates`,
      );
    }
  }
}

export function periodsOverlap(a: DateRange, b: DateRange): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function assertNoOverlappingActivePeriod(
  candidate: DateRange,
  existingActive: DateRange[],
): void {
  const conflict = existingActive.some((active) =>
    periodsOverlap(candidate, active),
  );

  if (conflict) {
    throw new BadRequestException(
      'Cannot activate: date range overlaps another active period for this regime',
    );
  }
}

export function assertActivatableStatus(status: AcademicPeriodStatus): void {
  if (status === AcademicPeriodStatus.ARCHIVED) {
    throw new BadRequestException('Archived periods cannot be activated');
  }
}

export function assertDeletableStatus(status: AcademicPeriodStatus): void {
  if (status === AcademicPeriodStatus.ACTIVE) {
    throw new BadRequestException(
      'Deactivate the period before deleting it',
    );
  }
}

export function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException('Invalid date value');
  }

  return parsed;
}

export const ACADEMIC_REGIME_LABELS: Record<AcademicRegime, string> = {
  [AcademicRegime.COSTA_GALAPAGOS]: 'Costa & Galápagos',
  [AcademicRegime.SIERRA_AMAZONIA]: 'Sierra & Amazonía',
};
