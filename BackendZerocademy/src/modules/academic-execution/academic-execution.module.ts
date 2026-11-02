import { Module } from '@nestjs/common';
import { ClassSessionsFoundationService } from './class-sessions-foundation.service';
import { ClassSessionsController } from './class-sessions.controller';
import { TimetablesModule } from '../timetables/timetables.module';

@Module({
  imports: [TimetablesModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsFoundationService],
  exports: [ClassSessionsFoundationService],
})
export class AcademicExecutionModule {}
