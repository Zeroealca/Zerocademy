import { Module } from '@nestjs/common';
import { ClassSessionsFoundationService } from './class-sessions-foundation.service';
import { ClassSessionsController } from './class-sessions.controller';

@Module({
  controllers: [ClassSessionsController],
  providers: [ClassSessionsFoundationService],
  exports: [ClassSessionsFoundationService],
})
export class AcademicExecutionModule {}
