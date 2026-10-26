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
  RepresentativeTimetableQueryDto,
  StudentTimetableListResponseDto,
  StudentTimetableQueryDto,
} from './dto/student-timetable.dto';
import { StudentTimetablesService } from './student-timetables.service';

@ApiTags('timetables')
@ApiStandardErrorResponses()
@Controller('timetables')
export class StudentTimetablesController {
  constructor(private readonly timetables: StudentTimetablesService) {}

  @Get('student/me')
  @ApiRequireRolesStrict(Role.STUDENT)
  @ApiOperation({
    summary: 'Get the authenticated student published weekly timetable',
  })
  @ApiOkResponse({ type: StudentTimetableListResponseDto })
  weekly(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StudentTimetableQueryDto,
  ): Promise<StudentTimetableListResponseDto> {
    return this.timetables.studentWeekly(actor, query.academicPeriodId);
  }

  @Get('student/me/today')
  @ApiRequireRolesStrict(Role.STUDENT)
  @ApiOperation({
    summary: 'Get the authenticated student published classes for today',
  })
  @ApiOkResponse({ type: StudentTimetableListResponseDto })
  today(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StudentTimetableQueryDto,
    @Headers('x-zerocademy-e2e-now') e2eNow?: string,
  ): Promise<StudentTimetableListResponseDto> {
    return this.timetables.studentToday(
      actor,
      query.academicPeriodId,
      this.e2eClock(e2eNow),
    );
  }

  @Get('representative')
  @ApiRequireRolesStrict(Role.REPRESENTATIVE)
  @ApiOperation({ summary: 'Get a linked student published weekly timetable' })
  @ApiOkResponse({ type: StudentTimetableListResponseDto })
  representativeWeekly(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: RepresentativeTimetableQueryDto,
  ): Promise<StudentTimetableListResponseDto> {
    return this.timetables.representativeWeekly(
      actor,
      query.studentId,
      query.academicPeriodId,
    );
  }

  @Get('representative/today')
  @ApiRequireRolesStrict(Role.REPRESENTATIVE)
  @ApiOperation({ summary: 'Get a linked student published classes for today' })
  @ApiOkResponse({ type: StudentTimetableListResponseDto })
  representativeToday(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: RepresentativeTimetableQueryDto,
    @Headers('x-zerocademy-e2e-now') e2eNow?: string,
  ): Promise<StudentTimetableListResponseDto> {
    return this.timetables.representativeToday(
      actor,
      query.studentId,
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
    )
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new BadRequestException('E2E clock override is unavailable');
    const now = new Date(value);
    if (Number.isNaN(now.getTime()))
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new BadRequestException('E2E clock override must be an ISO date');
    return now;
  }
}
