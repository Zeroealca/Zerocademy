import { Module } from '@nestjs/common';
import { AcademicLevelsController } from './academic-levels.controller';
import { AcademicLevelsService } from './academic-levels.service';

@Module({
  controllers: [AcademicLevelsController],
  providers: [AcademicLevelsService],
  exports: [AcademicLevelsService],
})
export class AcademicLevelsModule {}
