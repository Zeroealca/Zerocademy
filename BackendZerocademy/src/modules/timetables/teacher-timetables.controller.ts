import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  ApiRequireRolesStrict,
  ApiStandardErrorResponses,
} from '../../common/decorators/api';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  TeacherTimetableListResponseDto,
  TeacherTimetableQueryDto,
} from './dto/teacher-timetable.dto';
import { TeacherTimetablesService } from './teacher-timetables.service';

@ApiTags('timetables')
@ApiStandardErrorResponses()
@Controller('timetables/me')
export class TeacherTimetablesController {
  constructor(private readonly teacherTimetables: TeacherTimetablesService) {}

  @Get()
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({
    summary: 'Get the authenticated teacher published weekly timetable',
  })
  @ApiOkResponse({ type: TeacherTimetableListResponseDto })
  weekly(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: TeacherTimetableQueryDto,
  ): Promise<TeacherTimetableListResponseDto> {
    return this.teacherTimetables.weekly(actor, query.academicPeriodId);
  }

  @Get('today')
  @ApiRequireRolesStrict(Role.TEACHER)
  @ApiOperation({
    summary: 'Get the authenticated teacher published classes for today',
  })
  @ApiOkResponse({ type: TeacherTimetableListResponseDto })
  today(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: TeacherTimetableQueryDto,
    @Headers('x-zerocademy-e2e-now') e2eNow?: string,
  ): Promise<TeacherTimetableListResponseDto> {
    return this.teacherTimetables.today(
      actor,
      query.academicPeriodId,
      this.e2eClock(e2eNow),
    );
  }

  private e2eClock(value?: string): Date | undefined {
    if (!value) return undefined;
    const url = new URL(process.env.DATABASE_URL ?? 'postgresql://invalid');
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.E2E_TEST_CLOCK_ENABLED !== 'true' ||
      url.hostname !== 'postgres' ||
      url.pathname !== '/zerocademy_e2e'
    ) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new BadRequestException('E2E clock override is unavailable');
    }
    const now = new Date(value);
    if (Number.isNaN(now.getTime())) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new BadRequestException('E2E clock override must be an ISO date');
    }
    return now;
  }
}
