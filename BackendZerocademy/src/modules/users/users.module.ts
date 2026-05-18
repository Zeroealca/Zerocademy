import { Module } from '@nestjs/common';
import { RbacModule as RbacKernelModule } from '../../common/rbac/rbac.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [RbacKernelModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
