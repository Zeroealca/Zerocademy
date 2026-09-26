import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { AcademicUnitsController } from './academic-units.controller';
import { AcademicUnitsService } from './academic-units.service';
import { LessonPlansController } from './lesson-plans.controller';
import { LessonPlansService } from './lesson-plans.service';
import { AcademicPlanLessonPlansController } from './academic-plan-lesson-plans.controller';

@Module({
  controllers: [
    PlanningController,
    AcademicUnitsController,
    LessonPlansController,
    AcademicPlanLessonPlansController,
  ],
  providers: [PlanningService, AcademicUnitsService, LessonPlansService],
  exports: [PlanningService],
})
export class PlanningModule {}
