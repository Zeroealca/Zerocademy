import { Module } from '@nestjs/common';
import { AcademicPeriodsController } from './academic-periods.controller';
import { AcademicPeriodsService } from './academic-periods.service';
import { AcademicTermsController } from './academic-terms.controller';
import { AcademicTermsService } from './academic-terms.service';

@Module({
  controllers: [AcademicPeriodsController, AcademicTermsController],
  providers: [AcademicPeriodsService, AcademicTermsService],
  exports: [AcademicPeriodsService, AcademicTermsService],
})
export class AcademicPeriodsModule {}
