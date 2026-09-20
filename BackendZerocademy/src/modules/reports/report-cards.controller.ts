import { Controller, Get, Param, Query, StreamableFile } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRoles,
  ApiRequireRolesStrict,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ReportCardQueryDto } from './dto/report-card-query.dto';
import { ReportCardResponseDto } from './dto/report-card-response.dto';
import { ReportCardsService } from './report-cards.service';
import { ReportCardsPdfService } from './report-cards-pdf.service';

@ApiTags('report-cards')
@Controller('report-cards')
export class ReportCardsController {
  constructor(
    private readonly reportCardsService: ReportCardsService,
    private readonly reportCardsPdfService: ReportCardsPdfService,
  ) {}

  @Get('me/pdf')
  @ApiRequireRolesStrict(Role.STUDENT)
  @ApiOperation({
    summary: 'Download the authenticated student report card as PDF',
  })
  @ApiOkResponse({
    description: 'PDF document',
    content: { 'application/pdf': {} },
  })
  async downloadMyReportCardPdf(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ReportCardQueryDto,
  ): Promise<StreamableFile> {
    const pdf = await this.reportCardsPdfService.getMyPdf(actor, query);
    return new StreamableFile(pdf.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${pdf.filename}"`,
    });
  }

  @Get('me')
  @ApiRequireRolesStrict(Role.STUDENT)
  @ApiOperation({ summary: 'Get the authenticated student report card' })
  @ApiOkResponse({ type: ReportCardResponseDto })
  @ApiNotFoundResponse({
    description: 'Enrollment was not found for the academic period',
  })
  getMyReportCard(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: ReportCardQueryDto,
  ): Promise<ReportCardResponseDto> {
    return this.reportCardsService.getMyReportCard(actor, query);
  }

  @Get(':studentId')
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({
    summary: 'Get a student report card within the actor academic scope',
  })
  @ApiOkResponse({ type: ReportCardResponseDto })
  @ApiNotFoundResponse({
    description:
      'Student enrollment was not found or is outside the actor scope',
  })
  getStudentReportCard(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query() query: ReportCardQueryDto,
  ): Promise<ReportCardResponseDto> {
    return this.reportCardsService.getStudentReportCard(
      actor,
      studentId,
      query,
    );
  }

  @Get(':studentId/pdf')
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOperation({ summary: 'Download a scoped student report card as PDF' })
  @ApiOkResponse({
    description: 'PDF document',
    content: { 'application/pdf': {} },
  })
  async downloadStudentReportCardPdf(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('studentId') studentId: string,
    @Query() query: ReportCardQueryDto,
  ): Promise<StreamableFile> {
    const pdf = await this.reportCardsPdfService.getStudentPdf(
      actor,
      studentId,
      query,
    );
    return new StreamableFile(pdf.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${pdf.filename}"`,
    });
  }
}
