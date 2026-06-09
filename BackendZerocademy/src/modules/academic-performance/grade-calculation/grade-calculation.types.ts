import { RoundingStrategy } from '@prisma/client';

export interface CalculationInstitutionConfig {
  institutionId: string;
  gradingSchemeId: string;
  schemeMinScore: number;
  schemeMaxScore: number;
  passingScore: number;
  decimalPlaces: number;
  roundingStrategy: RoundingStrategy;
}

export interface AssessmentCategoryWeight {
  id: string;
  name: string;
  weight: number;
}

export interface AcademicTermWeight {
  academicTermId: string;
  academicTermName: string;
  order: number;
  weight: number;
}

export interface GradeCalculationInput {
  enrollmentId: string;
  subjectId: string;
  subjectName: string;
  academicTermId: string;
  assessmentCategoryId: string;
  assessmentId: string;
  assessmentWeight: number;
  assessmentMaxScore: number;
  score: number;
}

export interface CategoryAverageResult {
  assessmentCategoryId: string;
  assessmentCategoryName: string;
  weight: number;
  average: number | null;
  gradeCount: number;
}

export interface TermAverageResult {
  academicTermId: string;
  academicTermName: string;
  order: number;
  weight: number;
  average: number | null;
  categories: CategoryAverageResult[];
}

export interface SubjectAverageResult {
  subjectId: string;
  subjectName: string;
  average: number | null;
  terms: TermAverageResult[];
}

export interface WeightedAverageItem {
  value: number | null;
  weight: number;
}
