import { Module } from '@nestjs/common';
import { AcademicPerformanceController } from './academic-performance.controller';
import { AcademicPerformanceService } from './academic-performance.service';

@Module({
  controllers: [AcademicPerformanceController],
  providers: [AcademicPerformanceService],
  exports: [AcademicPerformanceService],
})
export class AcademicPerformanceModule {}
