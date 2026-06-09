import {
  type AssessmentCategoryWeight,
  type AcademicTermWeight,
  type CalculationInstitutionConfig,
  type CategoryAverageResult,
  type GradeCalculationInput,
  type SubjectAverageResult,
  type TermAverageResult,
  type WeightedAverageItem,
} from './grade-calculation.types';
import { applyRounding } from './rounding.util';

/**
 * Normalizes a raw score to the institution grading scheme scale.
 */
export function normalizeScoreToScheme(
  score: number,
  assessmentMaxScore: number,
  schemeMaxScore: number,
): number {
  if (assessmentMaxScore <= 0) {
    return 0;
  }

  return (score / assessmentMaxScore) * schemeMaxScore;
}

/**
 * Computes a weighted average over items with non-null values.
 * Weights are renormalized when some items are excluded.
 */
export function computeWeightedAverage(items: WeightedAverageItem[]): number | null {
  const valid = items.filter(
    (item) => item.value !== null && Number.isFinite(item.value),
  );

  if (valid.length === 0) {
    return null;
  }

  const totalWeight = valid.reduce((sum, item) => sum + item.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  const weightedSum = valid.reduce(
    (sum, item) => sum + (item.value as number) * item.weight,
    0,
  );

  return weightedSum / totalWeight;
}

export function computeCategoryAverage(
  grades: GradeCalculationInput[],
  categoryId: string,
  categoryName: string,
  categoryWeight: number,
  schemeMaxScore: number,
): CategoryAverageResult {
  const categoryGrades = grades.filter(
    (grade) => grade.assessmentCategoryId === categoryId,
  );

  if (categoryGrades.length === 0) {
    return {
      assessmentCategoryId: categoryId,
      assessmentCategoryName: categoryName,
      weight: categoryWeight,
      average: null,
      gradeCount: 0,
    };
  }

  const items: WeightedAverageItem[] = categoryGrades.map((grade) => ({
    value: normalizeScoreToScheme(
      grade.score,
      grade.assessmentMaxScore,
      schemeMaxScore,
    ),
    weight: grade.assessmentWeight,
  }));

  return {
    assessmentCategoryId: categoryId,
    assessmentCategoryName: categoryName,
    weight: categoryWeight,
    average: computeWeightedAverage(items),
    gradeCount: categoryGrades.length,
  };
}

export function computeTermAverage(
  grades: GradeCalculationInput[],
  academicTermId: string,
  academicTermName: string,
  order: number,
  termWeight: number,
  categories: AssessmentCategoryWeight[],
  schemeMaxScore: number,
): TermAverageResult {
  const termGrades = grades.filter(
    (grade) => grade.academicTermId === academicTermId,
  );

  const categoryResults = categories.map((category) =>
    computeCategoryAverage(
      termGrades,
      category.id,
      category.name,
      category.weight,
      schemeMaxScore,
    ),
  );

  const termAverage = computeWeightedAverage(
    categoryResults.map((category) => ({
      value: category.average,
      weight: category.weight,
    })),
  );

  return {
    academicTermId,
    academicTermName,
    order,
    weight: termWeight,
    average: termAverage,
    categories: categoryResults,
  };
}

export function computeSubjectAverage(
  grades: GradeCalculationInput[],
  subjectId: string,
  subjectName: string,
  academicTerms: AcademicTermWeight[],
  categories: AssessmentCategoryWeight[],
  config: CalculationInstitutionConfig,
): SubjectAverageResult {
  const subjectGrades = grades.filter((grade) => grade.subjectId === subjectId);

  const termResults = academicTerms.map((term) =>
    computeTermAverage(
      subjectGrades,
      term.academicTermId,
      term.academicTermName,
      term.order,
      term.weight,
      categories,
      config.schemeMaxScore,
    ),
  );

  const rawSubjectAverage = computeWeightedAverage(
    termResults.map((term) => ({
      value: term.average,
      weight: term.weight,
    })),
  );

  const average =
    rawSubjectAverage === null
      ? null
      : applyRounding(
          rawSubjectAverage,
          config.roundingStrategy,
          config.decimalPlaces,
        );

  const roundedTerms = termResults.map((term) => ({
    ...term,
    average:
      term.average === null
        ? null
        : applyRounding(
            term.average,
            config.roundingStrategy,
            config.decimalPlaces,
          ),
    categories: term.categories.map((category) => ({
      ...category,
      average:
        category.average === null
          ? null
          : applyRounding(
              category.average,
              config.roundingStrategy,
              config.decimalPlaces,
            ),
    })),
  }));

  return {
    subjectId,
    subjectName,
    average,
    terms: roundedTerms,
  };
}

export function isPassing(
  average: number | null,
  passingScore: number,
): boolean | null {
  if (average === null) {
    return null;
  }

  return average >= passingScore;
}
