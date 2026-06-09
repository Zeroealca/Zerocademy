import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiRequireRolesStrict } from '../../common/decorators/api';
import {
  ACADEMIC_PERFORMANCE_ADMIN_ROLES,
  ACADEMIC_PERFORMANCE_STUDENT_ROLES,
  ACADEMIC_PERFORMANCE_TEACHER_ROLES,
} from '../../common/rbac/rbac-role-sets';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AcademicPerformanceService } from './academic-performance.service';
import {
  AdminCoursePerformanceQueryDto,
  AdminInstitutionPerformanceQueryDto,
  AdminStudentPerformanceQueryDto,
} from './dto/admin-performance-query.dto';
import {
  AdminCoursePerformanceResponseDto,
  AdminInstitutionPerformanceResponseDto,
  AdminStudentPerformanceResponseDto,
  StudentPerformanceSummaryResponseDto,
  StudentSubjectAveragesResponseDto,
  StudentTermAveragesResponseDto,
  TeacherCourseAveragesResponseDto,
  TeacherStudentPerformanceResponseDto,
  TeacherSubjectPerformanceResponseDto,
} from './dto/performance-response.dto';
import {
  StudentPerformanceSummaryQueryDto,
  StudentSubjectAveragesQueryDto,
  StudentTermAveragesQueryDto,
} from './dto/student-performance-query.dto';
import {
  TeacherCourseAveragesQueryDto,
  TeacherStudentPerformanceQueryDto,
  TeacherSubjectPerformanceQueryDto,
} from './dto/teacher-performance-query.dto';

@ApiTags('academic-performance')
@Controller('academic-performance')
export class AcademicPerformanceController {
  constructor(
    private readonly academicPerformanceService: AcademicPerformanceService,
  ) {}

  @Get('student/subject-averages')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_STUDENT_ROLES)
  @ApiOperation({ summary: 'Student own subject averages' })
  @ApiOkResponse({ type: StudentSubjectAveragesResponseDto })
  getStudentSubjectAverages(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StudentSubjectAveragesQueryDto,
  ): Promise<StudentSubjectAveragesResponseDto> {
    return this.academicPerformanceService.getStudentSubjectAverages(
      actor,
      query,
    );
  }

  @Get('student/term-averages')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_STUDENT_ROLES)
  @ApiOperation({ summary: 'Student own term averages' })
  @ApiOkResponse({ type: StudentTermAveragesResponseDto })
  getStudentTermAverages(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StudentTermAveragesQueryDto,
  ): Promise<StudentTermAveragesResponseDto> {
    return this.academicPerformanceService.getStudentTermAverages(actor, query);
  }

  @Get('student/summary')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_STUDENT_ROLES)
  @ApiOperation({ summary: 'Student own performance summary' })
  @ApiOkResponse({ type: StudentPerformanceSummaryResponseDto })
  getStudentPerformanceSummary(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StudentPerformanceSummaryQueryDto,
  ): Promise<StudentPerformanceSummaryResponseDto> {
    return this.academicPerformanceService.getStudentPerformanceSummary(
      actor,
      query,
    );
  }

  @Get('teacher/course-averages')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_TEACHER_ROLES)
  @ApiOperation({ summary: 'Course averages by subject (teacher scoped)' })
  @ApiOkResponse({ type: TeacherCourseAveragesResponseDto })
  getTeacherCourseAverages(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: TeacherCourseAveragesQueryDto,
  ): Promise<TeacherCourseAveragesResponseDto> {
    return this.academicPerformanceService.getTeacherCourseAverages(
      actor,
      query,
    );
  }

  @Get('teacher/subject-performance')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_TEACHER_ROLES)
  @ApiOperation({ summary: 'Subject performance for a course (teacher scoped)' })
  @ApiOkResponse({ type: TeacherSubjectPerformanceResponseDto })
  getTeacherSubjectPerformance(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: TeacherSubjectPerformanceQueryDto,
  ): Promise<TeacherSubjectPerformanceResponseDto> {
    return this.academicPerformanceService.getTeacherSubjectPerformance(
      actor,
      query,
    );
  }

  @Get('teacher/student-performance')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_TEACHER_ROLES)
  @ApiOperation({ summary: 'Student performance (teacher scoped)' })
  @ApiOkResponse({ type: TeacherStudentPerformanceResponseDto })
  getTeacherStudentPerformance(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: TeacherStudentPerformanceQueryDto,
  ): Promise<TeacherStudentPerformanceResponseDto> {
    return this.academicPerformanceService.getTeacherStudentPerformance(
      actor,
      query,
    );
  }

  @Get('admin/institution-performance')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Institution-wide performance overview' })
  @ApiOkResponse({ type: AdminInstitutionPerformanceResponseDto })
  getAdminInstitutionPerformance(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AdminInstitutionPerformanceQueryDto,
  ): Promise<AdminInstitutionPerformanceResponseDto> {
    return this.academicPerformanceService.getAdminInstitutionPerformance(
      actor,
      query,
    );
  }

  @Get('admin/course-performance')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Course performance overview (admin)' })
  @ApiOkResponse({ type: AdminCoursePerformanceResponseDto })
  getAdminCoursePerformance(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AdminCoursePerformanceQueryDto,
  ): Promise<AdminCoursePerformanceResponseDto> {
    return this.academicPerformanceService.getAdminCoursePerformance(
      actor,
      query,
    );
  }

  @Get('admin/student-performance')
  @ApiRequireRolesStrict(...ACADEMIC_PERFORMANCE_ADMIN_ROLES)
  @ApiOperation({ summary: 'Student performance (admin)' })
  @ApiOkResponse({ type: AdminStudentPerformanceResponseDto })
  getAdminStudentPerformance(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: AdminStudentPerformanceQueryDto,
  ): Promise<AdminStudentPerformanceResponseDto> {
    return this.academicPerformanceService.getAdminStudentPerformance(
      actor,
      query,
    );
  }
}
