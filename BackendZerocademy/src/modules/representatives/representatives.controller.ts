import { Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, Body } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApiRequireRolesStrict } from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { RepresentativesService } from './representatives.service';
import { CreateRepresentativeStudentDto, UpsertRepresentativeStudentDto } from './dto/upsert-representative-student.dto';
import { RepresentativeStudentResponseDto } from './dto/representative-student-response.dto';

@ApiTags('representatives')
@Controller('representatives')
export class RepresentativesController {
  constructor(private readonly representativesService: RepresentativesService) {}

  @Get('me/students')
  @ApiRequireRolesStrict(Role.REPRESENTATIVE)
  @ApiOperation({ summary: 'List the authenticated representative active students' })
  @ApiOkResponse({ type: [RepresentativeStudentResponseDto] })
  getMyStudents(@CurrentUser() actor: AuthenticatedUser): Promise<RepresentativeStudentResponseDto[]> { return this.representativesService.getMyStudents(actor); }

  @Get('students/:studentId')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'List representative relationships for an institution student' })
  getForStudent(@CurrentUser() actor: AuthenticatedUser, @Param('studentId', ParseUUIDPipe) studentId: string): Promise<RepresentativeStudentResponseDto[]> { return this.representativesService.listForStudent(actor, studentId); }

  @Post('students/:studentId')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Associate a representative with an institution student' })
  create(@CurrentUser() actor: AuthenticatedUser, @Param('studentId', ParseUUIDPipe) studentId: string, @Body() dto: CreateRepresentativeStudentDto): Promise<RepresentativeStudentResponseDto> { return this.representativesService.create(actor, studentId, dto); }

  @Patch(':relationshipId')
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Update representative relationship metadata' })
  update(@CurrentUser() actor: AuthenticatedUser, @Param('relationshipId', ParseUUIDPipe) relationshipId: string, @Body() dto: UpsertRepresentativeStudentDto): Promise<RepresentativeStudentResponseDto> { return this.representativesService.update(actor, relationshipId, dto); }

  @Delete(':relationshipId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiRequireRolesStrict(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a representative relationship' })
  @ApiNoContentResponse({ description: 'Relationship deactivated' })
  deactivate(@CurrentUser() actor: AuthenticatedUser, @Param('relationshipId', ParseUUIDPipe) relationshipId: string): Promise<void> { return this.representativesService.deactivate(actor, relationshipId); }
}
