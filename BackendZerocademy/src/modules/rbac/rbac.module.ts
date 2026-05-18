import { Module } from '@nestjs/common';
import { RbacModule as RbacKernelModule } from '../../common/rbac/rbac.module';
import { RbacController } from './rbac.controller';
import { RbacService } from './rbac.service';

@Module({
  imports: [RbacKernelModule],
  controllers: [RbacController],
  providers: [RbacService],
  exports: [RbacService],
})
export class RbacModule {}
