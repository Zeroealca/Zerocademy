import { Module } from '@nestjs/common';
import { PlanningController } from './planning.controller';
import { PlanningService } from './planning.service';
import { AcademicUnitsController } from './academic-units.controller';
import { AcademicUnitsService } from './academic-units.service';

@Module({
  controllers: [PlanningController, AcademicUnitsController],
  providers: [PlanningService, AcademicUnitsService],
  exports: [PlanningService],
})
export class PlanningModule {}
