import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRoles, ApiRequireRolesStrict, ApiStandardErrorResponses } from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AdoptStudyPlanDto } from './dto/adopt-study-plan.dto';
import { InstitutionStudyPlanAdoptionResponseDto, OfficialStudyPlanResponseDto } from './dto/study-plan-response.dto';
import { StudyPlansService } from './study-plans.service';

@ApiTags('study-plans')
@ApiStandardErrorResponses()
@Controller('study-plans')
export class StudyPlansController {
  constructor(private readonly studyPlans: StudyPlansService) {}

  @Get()
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'List curated official study-plan versions' })
  @ApiOkResponse({ type: OfficialStudyPlanResponseDto, isArray: true })
  list(): Promise<OfficialStudyPlanResponseDto[]> { return this.studyPlans.list(); }

  @Get('institutions/:institutionId/academic-periods/:academicPeriodId/adoptions')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'List official study-plan adoptions for one institution and academic period' })
  @ApiOkResponse({ type: InstitutionStudyPlanAdoptionResponseDto, isArray: true })
  listAdoptions(@CurrentUser() actor: AuthenticatedUser, @Param('institutionId', ParseUUIDPipe) institutionId: string, @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string): Promise<InstitutionStudyPlanAdoptionResponseDto[]> {
    return this.studyPlans.listAdoptions(actor, institutionId, academicPeriodId);
  }

  @Post('institutions/:institutionId/academic-periods/:academicPeriodId/adoptions')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Adopt an applicable official study-plan version for an institution period' })
  @ApiCreatedResponse({ type: InstitutionStudyPlanAdoptionResponseDto })
  adopt(@CurrentUser() actor: AuthenticatedUser, @Param('institutionId', ParseUUIDPipe) institutionId: string, @Param('academicPeriodId', ParseUUIDPipe) academicPeriodId: string, @Body() dto: AdoptStudyPlanDto): Promise<InstitutionStudyPlanAdoptionResponseDto> {
    return this.studyPlans.adopt(actor, institutionId, academicPeriodId, dto);
  }

  @Get(':studyPlanId')
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Inspect an official study-plan version and its references' })
  @ApiOkResponse({ type: OfficialStudyPlanResponseDto })
  findOne(@Param('studyPlanId', ParseUUIDPipe) id: string): Promise<OfficialStudyPlanResponseDto> { return this.studyPlans.findOne(id); }
}
