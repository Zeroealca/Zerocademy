import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  ApiRequireRoles,
  ApiRequireRolesStrict,
} from '../../common/decorators/api';
import {
  INSTITUTION_OPS_READ_ROLES,
  INSTITUTION_OPS_WRITE_ROLES,
} from '../../common/rbac/rbac-role-sets';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ActiveAcademicPeriodResponseDto } from './dto/active-academic-period-response.dto';
import { AcademicTransitionListResponseDto } from './dto/academic-transition-list-response.dto';
import { AcademicTransitionPreviewResponseDto } from './dto/academic-transition-preview-response.dto';
import { AcademicTransitionRequestDto } from './dto/academic-transition-request.dto';
import { AcademicTransitionResponseDto } from './dto/academic-transition-response.dto';
import { SetActiveAcademicPeriodDto } from './dto/set-active-period.dto';
import { AcademicPeriodTransitionsService } from './academic-period-transitions.service';

@ApiTags('academic-period-transitions')
@Controller('institutions/:institutionId/academic-transitions')
export class AcademicPeriodTransitionsController {
  constructor(
    private readonly transitionsService: AcademicPeriodTransitionsService,
  ) {}

  @Get('active-period')
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({ summary: 'Get institution active academic period' })
  @ApiOkResponse({ type: ActiveAcademicPeriodResponseDto })
  getActivePeriod(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
  ): Promise<ActiveAcademicPeriodResponseDto> {
    return this.transitionsService.getActivePeriod(institutionId);
  }

  @Put('active-period')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({ summary: 'Set institution active academic period' })
  @ApiOkResponse({ type: ActiveAcademicPeriodResponseDto })
  setActivePeriod(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() dto: SetActiveAcademicPeriodDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ActiveAcademicPeriodResponseDto> {
    return this.transitionsService.setActivePeriod(institutionId, dto, actor);
  }

  @Get()
  @ApiRequireRoles(...INSTITUTION_OPS_READ_ROLES)
  @ApiOperation({ summary: 'List academic period transition history' })
  @ApiOkResponse({ type: AcademicTransitionListResponseDto })
  findHistory(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<AcademicTransitionListResponseDto> {
    return this.transitionsService.findHistory(
      institutionId,
      query.page,
      query.limit,
    );
  }

  @Post('preview')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({
    summary: 'Preview academic period transition',
    description:
      'Estimates copy counts without mutating historical data.',
  })
  @ApiOkResponse({ type: AcademicTransitionPreviewResponseDto })
  preview(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() dto: AcademicTransitionRequestDto,
  ): Promise<AcademicTransitionPreviewResponseDto> {
    return this.transitionsService.preview(institutionId, dto);
  }

  @Post('execute')
  @ApiRequireRolesStrict(...INSTITUTION_OPS_WRITE_ROLES)
  @ApiOperation({
    summary: 'Execute academic period transition',
    description:
      'Creates target period data, optionally copies courses and assignments, preserves history.',
  })
  @ApiCreatedResponse({ type: AcademicTransitionResponseDto })
  execute(
    @Param('institutionId', ParseUUIDPipe) institutionId: string,
    @Body() dto: AcademicTransitionRequestDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AcademicTransitionResponseDto> {
    return this.transitionsService.execute(institutionId, dto, actor);
  }
}
