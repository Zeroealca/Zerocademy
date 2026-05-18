import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiRequireRoles } from '../../common/decorators/api';
import { Role } from '@prisma/client';
import { RoleDefinitionResponseDto } from './dto/role-definition-response.dto';
import { RbacService } from './rbac.service';

@ApiTags('rbac')
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('roles')
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({
    summary: 'List system role definitions',
    description:
      'Returns RBAC role metadata including capabilities and limitations.',
  })
  @ApiOkResponse({ type: [RoleDefinitionResponseDto] })
  listRoles(): RoleDefinitionResponseDto[] {
    return this.rbacService.listRoleDefinitions();
  }
}
