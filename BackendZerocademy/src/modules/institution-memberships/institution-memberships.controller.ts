import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRoles } from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateInstitutionMembershipDto } from './dto/create-institution-membership.dto';
import { InstitutionMembershipListResponseDto } from './dto/institution-membership-list-response.dto';
import { InstitutionMembershipResponseDto } from './dto/institution-membership-response.dto';
import { ListInstitutionMembershipsQueryDto } from './dto/list-institution-memberships-query.dto';
import { UpdateInstitutionMembershipDto } from './dto/update-institution-membership.dto';
import { InstitutionMembershipsService } from './institution-memberships.service';

const READ_ROLES = [Role.SUPER_ADMIN, Role.ADMIN] as const;
const WRITE_ROLES = [Role.SUPER_ADMIN] as const;

@ApiTags('institution-memberships')
@Controller('institutions/:institutionId/memberships')
export class InstitutionMembershipsController {
  constructor(
    private readonly institutionMembershipsService: InstitutionMembershipsService,
  ) {}

  @Get()
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'List institution members (paginated)' })
  @ApiOkResponse({ type: InstitutionMembershipListResponseDto })
  findAll(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query() query: ListInstitutionMembershipsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InstitutionMembershipListResponseDto> {
    return this.institutionMembershipsService.findAll(
      institutionId,
      query,
      actor,
    );
  }

  @Get(':membershipId')
  @ApiRequireRoles(...READ_ROLES)
  @ApiOperation({ summary: 'Get institution membership by id' })
  @ApiOkResponse({ type: InstitutionMembershipResponseDto })
  @ApiNotFoundResponse()
  findOne(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<InstitutionMembershipResponseDto> {
    return this.institutionMembershipsService.findOne(
      institutionId,
      membershipId,
      actor,
    );
  }

  @Post()
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Assign user to institution' })
  @ApiCreatedResponse({ type: InstitutionMembershipResponseDto })
  assign(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() dto: CreateInstitutionMembershipDto,
  ): Promise<InstitutionMembershipResponseDto> {
    return this.institutionMembershipsService.assign(institutionId, dto);
  }

  @Patch(':membershipId')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update institution membership' })
  @ApiOkResponse({ type: InstitutionMembershipResponseDto })
  update(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateInstitutionMembershipDto,
  ): Promise<InstitutionMembershipResponseDto> {
    return this.institutionMembershipsService.update(
      institutionId,
      membershipId,
      dto,
    );
  }

  @Post(':membershipId/activate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Activate institution membership' })
  @ApiOkResponse({ type: InstitutionMembershipResponseDto })
  activate(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ): Promise<InstitutionMembershipResponseDto> {
    return this.institutionMembershipsService.activate(
      institutionId,
      membershipId,
    );
  }

  @Post(':membershipId/deactivate')
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Deactivate institution membership' })
  @ApiOkResponse({ type: InstitutionMembershipResponseDto })
  deactivate(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ): Promise<InstitutionMembershipResponseDto> {
    return this.institutionMembershipsService.deactivate(
      institutionId,
      membershipId,
    );
  }

  @Delete(':membershipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRoles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Remove institution membership' })
  @ApiNoContentResponse()
  remove(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ): Promise<void> {
    return this.institutionMembershipsService.remove(
      institutionId,
      membershipId,
    );
  }
}
