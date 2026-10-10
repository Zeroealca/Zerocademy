import { Module } from '@nestjs/common';
import { TimetablesController } from './timetables.controller';
import { TimetablesService } from './timetables.service';
import { ScheduleStructuresService } from './schedule-structures.service';

@Module({
  controllers: [TimetablesController],
  providers: [TimetablesService, ScheduleStructuresService],
})
export class TimetablesModule {}
