import { Module } from '@nestjs/common';
import { TimetablesController } from './timetables.controller';
import { TimetablesService } from './timetables.service';
import { ScheduleStructuresService } from './schedule-structures.service';
import { TimetableConflictEngine } from './timetable-conflict-engine.service';
import { TimetableGenerationService } from './timetable-generation.service';
import { TimetableAdminService } from './timetable-admin.service';
import { TeacherTimetablesController } from './teacher-timetables.controller';
import { TeacherTimetablesService } from './teacher-timetables.service';
import { TeacherTimetableClock } from './teacher-timetable-clock.service';

@Module({
  // Register the static /timetables/me routes before /timetables/:timetableId.
  controllers: [TeacherTimetablesController, TimetablesController],
  providers: [
    TimetablesService,
    ScheduleStructuresService,
    TimetableConflictEngine,
    TimetableGenerationService,
    TimetableAdminService,
    TeacherTimetablesService,
    TeacherTimetableClock,
  ],
})
export class TimetablesModule {}
