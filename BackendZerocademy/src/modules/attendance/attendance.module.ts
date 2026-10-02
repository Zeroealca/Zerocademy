import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceReportsService } from './attendance-reports.service';
import { AttendanceJustificationsController } from './attendance-justifications.controller';
import { AttendanceJustificationsService } from './attendance-justifications.service';
import { ClassSessionAttendanceController } from './class-session-attendance.controller';
import { ClassSessionAttendanceService } from './class-session-attendance.service';

@Module({
  controllers: [
    AttendanceController,
    AttendanceJustificationsController,
    ClassSessionAttendanceController,
  ],
  providers: [
    AttendanceService,
    AttendanceReportsService,
    AttendanceJustificationsService,
    ClassSessionAttendanceService,
  ],
})
export class AttendanceModule {}
