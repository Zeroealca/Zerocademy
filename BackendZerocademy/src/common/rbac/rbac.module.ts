import { Global, Module } from '@nestjs/common';
import { EffectivePermissionResolver } from './effective-permission-resolver.service';
import { MembershipPermissionEnforcer } from './membership-permission-enforcer.service';
import { PermissionDualEvaluationObserver } from './permission-dual-evaluation.observer';
import { PermissionProfileAssignmentService } from './permission-profile-assignment.service';
import { ProfileProvisioningService } from './profile-provisioning.service';

@Global()
@Module({
  providers: [
    ProfileProvisioningService,
    EffectivePermissionResolver,
    PermissionProfileAssignmentService,
    PermissionDualEvaluationObserver,
    MembershipPermissionEnforcer,
  ],
  exports: [
    ProfileProvisioningService,
    EffectivePermissionResolver,
    PermissionProfileAssignmentService,
    PermissionDualEvaluationObserver,
    MembershipPermissionEnforcer,
  ],
})
export class RbacModule {}
