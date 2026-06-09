import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { GradesController } from './grades.controller';
import { GradesService } from './grades.service';

@Module({
  controllers: [AssessmentsController, GradesController],
  providers: [AssessmentsService, GradesService],
  exports: [AssessmentsService, GradesService],
})
export class GradesModule {}
