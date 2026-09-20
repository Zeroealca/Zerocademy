import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceReportsService } from './attendance-reports.service';
import { AttendanceJustificationsController } from './attendance-justifications.controller';
import { AttendanceJustificationsService } from './attendance-justifications.service';

@Module({
  controllers: [AttendanceController, AttendanceJustificationsController],
  providers: [
    AttendanceService,
    AttendanceReportsService,
    AttendanceJustificationsService,
  ],
})
export class AttendanceModule {}
