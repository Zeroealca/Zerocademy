import { Module } from '@nestjs/common';
import { AssessmentCategoriesController } from './assessment-categories.controller';
import { AssessmentCategoriesService } from './assessment-categories.service';
import { EcuadorDefaultsService } from './ecuador-defaults.service';
import { PlatformAcademicEvaluationController } from './platform-academic-evaluation.controller';
import { PlatformAcademicEvaluationService } from './platform-academic-evaluation.service';
import { EvaluationTermsController } from './evaluation-terms.controller';
import { EvaluationTermsService } from './evaluation-terms.service';
import { GradeScalesController } from './grade-scales.controller';
import { GradeScalesService } from './grade-scales.service';
import { GradingSchemesController } from './grading-schemes.controller';
import { GradingSchemesService } from './grading-schemes.service';
import { InstitutionAcademicConfigurationController } from './institution-academic-configuration.controller';
import { InstitutionAcademicConfigurationService } from './institution-academic-configuration.service';

@Module({
  controllers: [
    GradingSchemesController,
    GradeScalesController,
    EvaluationTermsController,
    AssessmentCategoriesController,
    InstitutionAcademicConfigurationController,
    PlatformAcademicEvaluationController,
  ],
  providers: [
    GradingSchemesService,
    GradeScalesService,
    EvaluationTermsService,
    AssessmentCategoriesService,
    InstitutionAcademicConfigurationService,
    PlatformAcademicEvaluationService,
    EcuadorDefaultsService,
  ],
  exports: [
    GradingSchemesService,
    InstitutionAcademicConfigurationService,
    PlatformAcademicEvaluationService,
    EcuadorDefaultsService,
  ],
})
export class AcademicEvaluationModule {}
