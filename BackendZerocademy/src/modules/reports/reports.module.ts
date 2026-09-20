import { Module } from '@nestjs/common';
import { AcademicPerformanceModule } from '../academic-performance/academic-performance.module';
import { ReportCardsController } from './report-cards.controller';
import { ReportCardsPdfService } from './report-cards-pdf.service';
import { ReportCardsService } from './report-cards.service';

@Module({
  imports: [AcademicPerformanceModule],
  controllers: [ReportCardsController],
  providers: [ReportCardsService, ReportCardsPdfService],
})
export class ReportsModule {}
