import { Module } from '@nestjs/common';
import { RbacModule } from '../../common/rbac/rbac.module';
import { InstitutionMembershipsController } from './institution-memberships.controller';
import { InstitutionMembershipsService } from './institution-memberships.service';

@Module({
  imports: [RbacModule],
  controllers: [InstitutionMembershipsController],
  providers: [InstitutionMembershipsService],
  exports: [InstitutionMembershipsService],
})
export class InstitutionMembershipsModule {}
