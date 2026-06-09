import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import { findActiveInstitutionOrThrow } from '../institutions/institution.validation';
import {
  WEIGHT_SUM_TARGET,
  WEIGHT_SUM_TOLERANCE,
} from './constants';

export interface NumericRange {
  minValue: number;
  maxValue: number;
}

export interface GradeScaleInput extends NumericRange {
  id?: string;
  code: string;
  order: number;
}

export function decimalToNumber(value: Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function assertValidGradingRange(
  minScore: number,
  maxScore: number,
  passingScore: number,
): void {
  if (minScore >= maxScore) {
    throw new BadRequestException('Minimum score must be less than maximum score');
  }

  if (passingScore < minScore || passingScore > maxScore) {
    throw new BadRequestException(
      'Passing score must be within the grading range',
    );
  }
}

export function assertValidDecimalPlaces(decimalPlaces: number): void {
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0 || decimalPlaces > 4) {
    throw new BadRequestException('Decimal places must be an integer between 0 and 4');
  }
}

export function assertNoOverlappingGradeScales(
  scales: GradeScaleInput[],
  schemeMin: number,
  schemeMax: number,
): void {
  if (scales.length === 0) {
    return;
  }

  for (const scale of scales) {
    if (scale.minValue > scale.maxValue) {
      throw new BadRequestException(
        `Grade scale "${scale.code}" has an invalid range`,
      );
    }

    if (scale.minValue < schemeMin || scale.maxValue > schemeMax) {
      throw new BadRequestException(
        `Grade scale "${scale.code}" must fit within the grading scheme range`,
      );
    }
  }

  const sorted = [...scales].sort((a, b) => a.minValue - b.minValue);

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    if (current.minValue <= previous.maxValue) {
      throw new BadRequestException(
        `Grade scales "${previous.code}" and "${current.code}" overlap`,
      );
    }
  }
}

export function assertWeightsSumToTarget(
  weights: number[],
  label: string,
): void {
  if (weights.length === 0) {
    return;
  }

  const sum = weights.reduce((total, weight) => total + weight, 0);
  const delta = Math.abs(sum - WEIGHT_SUM_TARGET);

  if (delta > WEIGHT_SUM_TOLERANCE) {
    throw new BadRequestException(
      `${label} weights must sum to ${WEIGHT_SUM_TARGET} (current sum: ${sum.toFixed(2)})`,
    );
  }
}

export function assertValidWeight(weight: number, label: string): void {
  if (weight <= 0 || weight > WEIGHT_SUM_TARGET) {
    throw new BadRequestException(
      `${label} weight must be greater than 0 and at most ${WEIGHT_SUM_TARGET}`,
    );
  }
}

export async function assertInstitutionExistsAndActive(
  prisma: PrismaService,
  institutionId: string,
): Promise<void> {
  await findActiveInstitutionOrThrow(prisma, institutionId);
}

export async function assertAcademicPeriodForInstitution(
  prisma: PrismaService,
  institutionId: string,
  academicPeriodId: string,
): Promise<void> {
  const period = await prisma.academicPeriod.findFirst({
    where: {
      id: academicPeriodId,
      OR: [{ institutionId }, { institutionId: null }],
    },
    select: { id: true },
  });

  if (!period) {
    throw new NotFoundException(
      'Academic period not found for this institution',
    );
  }
}

export async function assertGradingSchemeAccessible(
  prisma: PrismaService,
  gradingSchemeId: string,
  institutionId?: string | null,
): Promise<void> {
  const scheme = await prisma.gradingScheme.findFirst({
    where: {
      id: gradingSchemeId,
      OR: [
        { institutionId: institutionId ?? undefined },
        { institutionId: null },
      ],
    },
    select: { id: true },
  });

  if (!scheme) {
    throw new NotFoundException('Grading scheme not found');
  }
}
