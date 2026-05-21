import { Module } from '@nestjs/common';
import { AcademicPeriodTransitionsController } from './academic-period-transitions.controller';
import { AcademicPeriodTransitionsService } from './academic-period-transitions.service';

@Module({
  controllers: [AcademicPeriodTransitionsController],
  providers: [AcademicPeriodTransitionsService],
  exports: [AcademicPeriodTransitionsService],
})
export class AcademicPeriodTransitionsModule {}
