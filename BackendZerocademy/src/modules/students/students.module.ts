import { Module } from '@nestjs/common';
import { RbacModule as RbacKernelModule } from '../../common/rbac/rbac.module';
import { StudentBulkImportService } from './student-bulk-import.service';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';

@Module({
  imports: [RbacKernelModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentBulkImportService],
  exports: [StudentsService],
})
export class StudentsModule {}
