import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { ClassSessionsFoundationService } from './class-sessions-foundation.service';
import {
  CreateClassSessionDto,
  UpdateClassSessionDto,
} from './dto/class-session.dto';
import { ClassSessionResponseDto } from './dto/class-session-response.dto';

@ApiTags('class-sessions')
@ApiBearerAuth('access-token')
@ApiStandardErrorResponses()
@Controller('teacher-assignments/:teacherAssignmentId/class-sessions')
export class ClassSessionsController {
  constructor(private readonly sessions: ClassSessionsFoundationService) {}
  @Get()
  @ApiOperation({ summary: 'List class sessions for a teacher assignment' })
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: ClassSessionResponseDto, isArray: true })
  async list(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) assignmentId: string,
  ): Promise<ClassSessionResponseDto[]> {
    return (await this.sessions.list(actor, assignmentId)).map((session) =>
      ClassSessionResponseDto.from(session),
    );
  }
  @Get(':classSessionId')
  @ApiOperation({
    summary: 'Read a class session within its teacher assignment',
  })
  @ApiRequireRoles(Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER)
  @ApiOkResponse({ type: ClassSessionResponseDto })
  async one(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) assignmentId: string,
    @Param('classSessionId', ParseUUIDPipe) id: string,
  ): Promise<ClassSessionResponseDto> {
    return ClassSessionResponseDto.from(
      await this.sessions.one(actor, assignmentId, id),
    );
  }
  @Post()
  @ApiOperation({
    summary: 'Create a class session for an owned teacher assignment',
  })
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiCreatedResponse({ type: ClassSessionResponseDto })
  async create(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) assignmentId: string,
    @Body() dto: CreateClassSessionDto,
  ): Promise<ClassSessionResponseDto> {
    return ClassSessionResponseDto.from(
      await this.sessions.create(actor, {
        ...dto,
        teacherAssignmentId: assignmentId,
      }),
    );
  }
  @Patch(':classSessionId')
  @ApiOperation({
    summary: 'Update a class session within an owned teacher assignment',
  })
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOkResponse({ type: ClassSessionResponseDto })
  async update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('teacherAssignmentId', ParseUUIDPipe) assignmentId: string,
    @Param('classSessionId', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClassSessionDto,
  ): Promise<ClassSessionResponseDto> {
    return ClassSessionResponseDto.from(
      await this.sessions.update(actor, assignmentId, id, dto),
    );
  }
}
