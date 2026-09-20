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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRoles,
  ApiRequireRolesStrict,
  ApiStandardErrorResponses,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AcademicPlanListResponseDto } from './dto/academic-plan-list-response.dto';
import { AcademicPlanResponseDto } from './dto/academic-plan-response.dto';
import { CreateAcademicPlanDto } from './dto/create-academic-plan.dto';
import { ListAcademicPlansQueryDto } from './dto/list-academic-plans-query.dto';
import { UpdateAcademicPlanDto } from './dto/update-academic-plan.dto';
import { PlanningService } from './planning.service';

@ApiTags('academic-plans')
@Controller('academic-plans')
@ApiStandardErrorResponses()
export class PlanningController {
  constructor(private readonly planningService: PlanningService) {}

  @Get()
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'List academic plans visible to the authenticated actor',
  })
  @ApiOkResponse({ type: AcademicPlanListResponseDto })
  findAll(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ListAcademicPlansQueryDto,
  ): Promise<AcademicPlanListResponseDto> {
    return this.planningService.findAll(actor, query);
  }

  @Get(':id')
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Get an academic plan detail' })
  @ApiOkResponse({ type: AcademicPlanResponseDto })
  findOne(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicPlanResponseDto> {
    return this.planningService.findOne(actor, id);
  }

  @Post()
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({
    summary: 'Create an academic plan draft for an owned teacher assignment',
  })
  @ApiCreatedResponse({ type: AcademicPlanResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateAcademicPlanDto,
  ): Promise<AcademicPlanResponseDto> {
    return this.planningService.create(actor, dto);
  }

  @Patch(':id')
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({ summary: 'Update an owned academic plan draft' })
  @ApiOkResponse({ type: AcademicPlanResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicPlanDto,
  ): Promise<AcademicPlanResponseDto> {
    return this.planningService.update(actor, id, dto);
  }

  @Post(':id/publish')
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({ summary: 'Publish an owned, complete academic plan draft' })
  @ApiOkResponse({ type: AcademicPlanResponseDto })
  publish(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AcademicPlanResponseDto> {
    return this.planningService.publish(actor, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({ summary: 'Delete an owned academic plan draft' })
  @ApiNoContentResponse()
  remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.planningService.remove(actor, id);
  }
}
