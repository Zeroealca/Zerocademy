import { Global, Module } from '@nestjs/common';
import { ProfileProvisioningService } from './profile-provisioning.service';

@Global()
@Module({
  providers: [ProfileProvisioningService],
  exports: [ProfileProvisioningService],
})
export class RbacModule {}
