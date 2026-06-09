export type RoundingStrategy =
  | "ROUND_HALF_UP"
  | "ROUND_DOWN"
  | "ROUND_UP"
  | "TRUNCATE";

export interface GradingScheme {
  id: string;
  institutionId: string | null;
  name: string;
  minScore: number;
  maxScore: number;
  passingScore: number;
  decimalPlaces: number;
  isDefault: boolean;
  isActive: boolean;
  gradeScales?: GradeScale[];
  createdAt: string;
  updatedAt: string;
}

export interface GradeScale {
  id: string;
  gradingSchemeId: string;
  code: string;
  description: string;
  minValue: number;
  maxValue: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationTerm {
  id: string;
  institutionId: string;
  academicPeriodId: string;
  name: string;
  order: number;
  weight: number;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentCategory {
  id: string;
  institutionId: string;
  name: string;
  weight: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InstitutionAcademicConfiguration {
  id: string;
  institutionId: string;
  gradingSchemeId: string;
  activeAcademicPeriodId: string | null;
  roundingStrategy: RoundingStrategy;
  decimalPlaces: number;
  gradingScheme?: GradingScheme;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationConfigPreview {
  configuration: InstitutionAcademicConfiguration | null;
  activeGradingScheme: GradingScheme | null;
  evaluationTerms: EvaluationTerm[];
  assessmentCategories: AssessmentCategory[];
  evaluationTermWeightTotal: number;
  assessmentCategoryWeightTotal: number;
}

export interface GradingSchemesFilters {
  page: number;
  limit: number;
  institutionId?: string;
  isActive?: boolean;
  search?: string;
}

export interface EvaluationTermsFilters {
  page: number;
  limit: number;
  institutionId: string;
  academicPeriodId: string;
  isActive?: boolean;
}

export interface AssessmentCategoriesFilters {
  page: number;
  limit: number;
  institutionId: string;
  isActive?: boolean;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GradingSchemesListResponse {
  data: GradingScheme[];
  meta: PaginationMeta;
}

export interface EvaluationTermsListResponse {
  data: EvaluationTerm[];
  meta: PaginationMeta;
}

export interface AssessmentCategoriesListResponse {
  data: AssessmentCategory[];
  meta: PaginationMeta;
}

export interface CreateGradingSchemeInput {
  institutionId?: string;
  name: string;
  minScore: number;
  maxScore: number;
  passingScore: number;
  decimalPlaces?: number;
  isDefault?: boolean;
}

export type UpdateGradingSchemeInput = Partial<CreateGradingSchemeInput>;

export interface CreateGradeScaleInput {
  code: string;
  description: string;
  minValue: number;
  maxValue: number;
  order: number;
}

export type UpdateGradeScaleInput = Partial<CreateGradeScaleInput>;

export interface CreateEvaluationTermInput {
  institutionId: string;
  academicPeriodId: string;
  name: string;
  order: number;
  weight: number;
  startDate?: string;
  endDate?: string;
}

export type UpdateEvaluationTermInput = Partial<
  Omit<CreateEvaluationTermInput, "institutionId" | "academicPeriodId">
>;

export interface CreateAssessmentCategoryInput {
  institutionId: string;
  name: string;
  weight: number;
  description?: string;
}

export type UpdateAssessmentCategoryInput = Partial<
  Omit<CreateAssessmentCategoryInput, "institutionId">
>;

export interface UpsertInstitutionConfigurationInput {
  gradingSchemeId: string;
  activeAcademicPeriodId?: string;
  roundingStrategy?: RoundingStrategy;
  decimalPlaces?: number;
}

export interface AssessmentCategoryTemplate {
  id: string;
  name: string;
  weight: number;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationTermTemplate {
  id: string;
  name: string;
  order: number;
  weight: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformAcademicEvaluation {
  id: string;
  gradingSchemeId: string;
  roundingStrategy: RoundingStrategy;
  decimalPlaces: number;
  gradingScheme: GradingScheme;
  assessmentCategoryTemplates: AssessmentCategoryTemplate[];
  evaluationTermTemplates: EvaluationTermTemplate[];
  updatedAt: string;
}

export interface UpsertPlatformAcademicEvaluationInput {
  gradingSchemeId?: string;
  roundingStrategy?: RoundingStrategy;
  decimalPlaces?: number;
}

export interface CreateAssessmentCategoryTemplateInput {
  name: string;
  weight: number;
  order: number;
  description?: string;
}

export type UpdateAssessmentCategoryTemplateInput = Partial<
  CreateAssessmentCategoryTemplateInput & { isActive: boolean }
>;

export interface CreateEvaluationTermTemplateInput {
  name: string;
  order: number;
  weight: number;
  description?: string;
}

export type UpdateEvaluationTermTemplateInput = Partial<
  CreateEvaluationTermTemplateInput & { isActive: boolean }
>;
