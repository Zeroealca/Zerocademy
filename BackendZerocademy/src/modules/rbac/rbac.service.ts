import { Injectable } from '@nestjs/common';
import { ROLE_DEFINITIONS, SYSTEM_ROLES } from '../../common/rbac/rbac.constants';
import { RoleDefinitionResponseDto } from './dto/role-definition-response.dto';

@Injectable()
export class RbacService {
  listRoleDefinitions(): RoleDefinitionResponseDto[] {
    return SYSTEM_ROLES.map((role) => {
      const definition = ROLE_DEFINITIONS[role];
      return {
        role: definition.role,
        label: definition.label,
        summary: definition.summary,
        capabilities: [...definition.capabilities],
        limitations: [...definition.limitations],
      };
    });
  }
}
