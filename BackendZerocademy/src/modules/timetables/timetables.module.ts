import { Module } from '@nestjs/common';
import { TimetablesController } from './timetables.controller';
import { TimetablesService } from './timetables.service';
import { ScheduleStructuresService } from './schedule-structures.service';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';

@Module({
  controllers: [TimetablesController],
  providers: [
    TimetablesService,
    ScheduleStructuresService,
    TimetableConflictEngine,
  ],
})
export class TimetablesModule {}
