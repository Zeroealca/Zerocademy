import { Module } from '@nestjs/common';
import { SubLevelsController } from './sub-levels.controller';
import { SubLevelsService } from './sub-levels.service';
@Module({
  controllers: [SubLevelsController],
  providers: [SubLevelsService],
  exports: [SubLevelsService],
})
export class SubLevelsModule {}
