import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  assertActorCanAccessInstitution,
  assertTeacherCanAccessCourse,
  assertTeacherOwnsSubjectInCourse,
  resolveStudentEnrollment,
} from './academic-performance.validation';
import { ACADEMIC_PERFORMANCE_CONTEXT } from './constants';
import type {
  AdminCoursePerformanceQueryDto,
  AdminInstitutionPerformanceQueryDto,
  AdminStudentPerformanceQueryDto,
} from './dto/admin-performance-query.dto';
import type {
  AdminCoursePerformanceResponseDto,
  AdminInstitutionPerformanceResponseDto,
  AdminStudentPerformanceResponseDto,
  StudentPerformanceSummaryResponseDto,
  StudentSubjectAveragesResponseDto,
  StudentTermAveragesResponseDto,
  SubjectAverageResponseDto,
  TeacherCourseAveragesResponseDto,
  TeacherStudentPerformanceResponseDto,
  TeacherSubjectPerformanceResponseDto,
} from './dto/performance-response.dto';
import type {
  StudentPerformanceSummaryQueryDto,
  StudentSubjectAveragesQueryDto,
  StudentTermAveragesQueryDto,
} from './dto/student-performance-query.dto';
import type {
  TeacherCourseAveragesQueryDto,
  TeacherStudentPerformanceQueryDto,
  TeacherSubjectPerformanceQueryDto,
} from './dto/teacher-performance-query.dto';
import { resolveCalculationConfig } from './grade-calculation/grade-calculation.config-resolver';
import {
  loadDistinctSubjectsForEnrollment,
  loadGradesForCourseEnrollments,
  loadGradesForEnrollment,
} from './grade-calculation/grade-calculation.data-loader';
import {
  computeSubjectAverage,
  computeTermAverage,
  computeWeightedAverage,
  isPassing,
} from './grade-calculation/grade-calculation.engine';
import { applyRounding } from './grade-calculation/rounding.util';

@Injectable()
export class AcademicPerformanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
  ) {}

  async getStudentSubjectAverages(
    actor: AuthenticatedUser,
    query: StudentSubjectAveragesQueryDto,
  ): Promise<StudentSubjectAveragesResponseDto> {
    this.logCalculationRequest('STUDENT_SUBJECT_AVERAGES', actor, query);

    if (actor.role !== Role.STUDENT) {
      throw new ForbiddenException('Students only');
    }

    const enrollment = await resolveStudentEnrollment(
      this.prisma,
      actor,
      query.academicPeriodId,
    );

    const subjects = await this.buildSubjectAveragesForEnrollment(
      enrollment.enrollmentId,
      enrollment.institutionId,
      query.academicPeriodId,
    );

    return {
      academicPeriodId: query.academicPeriodId,
      enrollmentId: enrollment.enrollmentId,
      subjects,
    };
  }

  async getStudentTermAverages(
    actor: AuthenticatedUser,
    query: StudentTermAveragesQueryDto,
  ): Promise<StudentTermAveragesResponseDto> {
    this.logCalculationRequest('STUDENT_TERM_AVERAGES', actor, query);

    if (actor.role !== Role.STUDENT) {
      throw new ForbiddenException('Students only');
    }

    const enrollment = await resolveStudentEnrollment(
      this.prisma,
      actor,
      query.academicPeriodId,
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      enrollment.institutionId,
      query.academicPeriodId,
    );

    const grades = await loadGradesForEnrollment(
      this.prisma,
      enrollment.enrollmentId,
      query.academicPeriodId,
      {
        subjectId: query.subjectId,
        academicTermId: query.academicTermId,
      },
    );

    const terms = config.academicTerms
      .filter((term) =>
        query.academicTermId
          ? term.academicTermId === query.academicTermId
          : true,
      )
      .map((term) => {
        const result = computeTermAverage(
          grades,
          term.academicTermId,
          term.academicTermName,
          term.order,
          term.weight,
          config.categories,
          config.institution.schemeMaxScore,
        );

        return {
          ...result,
          average:
            result.average === null
              ? null
              : applyRounding(
                  result.average,
                  config.institution.roundingStrategy,
                  config.institution.decimalPlaces,
                ),
          categories: result.categories.map((category) => ({
            ...category,
            average:
              category.average === null
                ? null
                : applyRounding(
                    category.average,
                    config.institution.roundingStrategy,
                    config.institution.decimalPlaces,
                  ),
          })),
        };
      });

    return {
      academicPeriodId: query.academicPeriodId,
      enrollmentId: enrollment.enrollmentId,
      subjectId: query.subjectId,
      terms,
    };
  }

  async getStudentPerformanceSummary(
    actor: AuthenticatedUser,
    query: StudentPerformanceSummaryQueryDto,
  ): Promise<StudentPerformanceSummaryResponseDto> {
    this.logCalculationRequest('STUDENT_PERFORMANCE_SUMMARY', actor, query);

    if (actor.role !== Role.STUDENT) {
      throw new ForbiddenException('Students only');
    }

    const enrollment = await resolveStudentEnrollment(
      this.prisma,
      actor,
      query.academicPeriodId,
    );

    const subjects = await this.buildSubjectAveragesForEnrollment(
      enrollment.enrollmentId,
      enrollment.institutionId,
      query.academicPeriodId,
    );

    const gradedSubjects = subjects.filter(
      (subject) => subject.average !== null,
    );
    const overallAverage = computeWeightedAverage(
      gradedSubjects.map((subject) => ({
        value: subject.average,
        weight: 1,
      })),
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      enrollment.institutionId,
      query.academicPeriodId,
    );

    const roundedOverall =
      overallAverage === null
        ? null
        : applyRounding(
            overallAverage,
            config.institution.roundingStrategy,
            config.institution.decimalPlaces,
          );

    return {
      academicPeriodId: query.academicPeriodId,
      enrollmentId: enrollment.enrollmentId,
      overallAverage: roundedOverall,
      subjectCount: subjects.length,
      passingSubjectCount: subjects.filter((subject) => subject.isPassing)
        .length,
      subjects,
    };
  }

  async getTeacherCourseAverages(
    actor: AuthenticatedUser,
    query: TeacherCourseAveragesQueryDto,
  ): Promise<TeacherCourseAveragesResponseDto> {
    this.logCalculationRequest('TEACHER_COURSE_AVERAGES', actor, query);

    const course = await assertTeacherCanAccessCourse(
      this.prisma,
      actor,
      query.courseId,
      query.academicPeriodId,
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      course.institutionId,
      query.academicPeriodId,
    );

    const enrollmentData = await loadGradesForCourseEnrollments(
      this.prisma,
      query.courseId,
      query.academicPeriodId,
    );

    const subjectMap = new Map<
      string,
      { subjectName: string; studentAverages: number[] }
    >();

    for (const enrollment of enrollmentData) {
      const subjects = await loadDistinctSubjectsForEnrollment(
        this.prisma,
        enrollment.enrollmentId,
        query.academicPeriodId,
      );

      for (const subject of subjects) {
        const result = computeSubjectAverage(
          enrollment.grades,
          subject.subjectId,
          subject.subjectName,
          config.academicTerms,
          config.categories,
          config.institution,
        );

        if (result.average === null) {
          continue;
        }

        const existing = subjectMap.get(subject.subjectId) ?? {
          subjectName: subject.subjectName,
          studentAverages: [],
        };

        existing.studentAverages.push(result.average);
        subjectMap.set(subject.subjectId, existing);
      }
    }

    const subjects = [...subjectMap.entries()].map(([subjectId, data]) => {
      const classAverage = computeWeightedAverage(
        data.studentAverages.map((average) => ({ value: average, weight: 1 })),
      );

      return {
        subjectId,
        subjectName: data.subjectName,
        classAverage:
          classAverage === null
            ? null
            : applyRounding(
                classAverage,
                config.institution.roundingStrategy,
                config.institution.decimalPlaces,
              ),
        studentCount: enrollmentData.length,
        gradedStudentCount: data.studentAverages.length,
      };
    });

    return {
      courseId: query.courseId,
      courseName: course.courseName,
      academicPeriodId: query.academicPeriodId,
      subjects,
    };
  }

  async getTeacherSubjectPerformance(
    actor: AuthenticatedUser,
    query: TeacherSubjectPerformanceQueryDto,
  ): Promise<TeacherSubjectPerformanceResponseDto> {
    this.logCalculationRequest('TEACHER_SUBJECT_PERFORMANCE', actor, query);

    const subject = await assertTeacherOwnsSubjectInCourse(
      this.prisma,
      actor,
      query.courseId,
      query.subjectId,
      query.academicPeriodId,
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      subject.institutionId,
      query.academicPeriodId,
    );

    const enrollmentData = await loadGradesForCourseEnrollments(
      this.prisma,
      query.courseId,
      query.academicPeriodId,
      { subjectId: query.subjectId },
    );

    const students = enrollmentData.map((enrollment) => {
      const result = computeSubjectAverage(
        enrollment.grades,
        query.subjectId,
        subject.subjectName,
        config.academicTerms,
        config.categories,
        config.institution,
      );

      return {
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        subjectAverage: result.average,
        isPassing: isPassing(result.average, config.institution.passingScore),
      };
    });

    const classAverage = computeWeightedAverage(
      students
        .filter((student) => student.subjectAverage !== null)
        .map((student) => ({
          value: student.subjectAverage,
          weight: 1,
        })),
    );

    return {
      courseId: query.courseId,
      subjectId: query.subjectId,
      subjectName: subject.subjectName,
      academicPeriodId: query.academicPeriodId,
      classAverage:
        classAverage === null
          ? null
          : applyRounding(
              classAverage,
              config.institution.roundingStrategy,
              config.institution.decimalPlaces,
            ),
      students,
    };
  }

  async getTeacherStudentPerformance(
    actor: AuthenticatedUser,
    query: TeacherStudentPerformanceQueryDto,
  ): Promise<TeacherStudentPerformanceResponseDto> {
    this.logCalculationRequest('TEACHER_STUDENT_PERFORMANCE', actor, query);

    if (actor.role === Role.STUDENT) {
      throw new ForbiddenException('Access denied');
    }

    const enrollment = await resolveStudentEnrollment(
      this.prisma,
      actor,
      query.academicPeriodId,
      query.studentId,
      query.courseId,
    );

    if (actor.role === Role.TEACHER && query.courseId) {
      await assertTeacherCanAccessCourse(
        this.prisma,
        actor,
        query.courseId,
        query.academicPeriodId,
      );
    } else if (actor.role === Role.TEACHER) {
      throw new ForbiddenException('Teachers must specify a course scope');
    } else {
      await assertActorCanAccessInstitution(
        this.prisma,
        actor,
        enrollment.institutionId,
      );
    }

    const subjects = await this.buildSubjectAveragesForEnrollment(
      enrollment.enrollmentId,
      enrollment.institutionId,
      query.academicPeriodId,
    );

    const gradedSubjects = subjects.filter(
      (subject) => subject.average !== null,
    );
    const overallAverage = computeWeightedAverage(
      gradedSubjects.map((subject) => ({
        value: subject.average,
        weight: 1,
      })),
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      enrollment.institutionId,
      query.academicPeriodId,
    );

    return {
      studentId: enrollment.studentId,
      studentName: enrollment.studentName,
      academicPeriodId: query.academicPeriodId,
      courseId: query.courseId,
      overallAverage:
        overallAverage === null
          ? null
          : applyRounding(
              overallAverage,
              config.institution.roundingStrategy,
              config.institution.decimalPlaces,
            ),
      subjects,
    };
  }

  async getAdminInstitutionPerformance(
    actor: AuthenticatedUser,
    query: AdminInstitutionPerformanceQueryDto,
  ): Promise<AdminInstitutionPerformanceResponseDto> {
    this.logCalculationRequest('ADMIN_INSTITUTION_PERFORMANCE', actor, query);

    if (!RoleUtils.isSuperAdmin(actor.role) && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const institutionId =
      query.institutionId ??
      (await resolveActorInstitutionId(this.prisma, actor));

    if (!institutionId) {
      throw new NotFoundException('Institution not found');
    }

    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);

    const courses = await this.prisma.course.findMany({
      where: {
        institutionId,
        academicPeriodId: query.academicPeriodId,
        isActive: true,
      },
      select: { id: true, name: true, section: true },
      orderBy: [{ name: 'asc' }, { section: 'asc' }],
    });

    const courseSummaries = await Promise.all(
      courses.map(async (course) => {
        const coursePerformance = await this.getTeacherCourseAverages(actor, {
          academicPeriodId: query.academicPeriodId,
          courseId: course.id,
        });

        const subjectAverages = coursePerformance.subjects
          .map((subject) => subject.classAverage)
          .filter((average): average is number => average !== null);

        const averagePerformance = computeWeightedAverage(
          subjectAverages.map((average) => ({ value: average, weight: 1 })),
        );

        const enrollmentCount = await this.prisma.enrollment.count({
          where: {
            courseId: course.id,
            academicPeriodId: query.academicPeriodId,
            status: 'ACTIVE',
          },
        });

        return {
          courseId: course.id,
          courseName: `${course.name} ${course.section}`,
          averagePerformance,
          studentCount: enrollmentCount,
        };
      }),
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      institutionId,
      query.academicPeriodId,
    );

    const institutionAverage = computeWeightedAverage(
      courseSummaries
        .filter((course) => course.averagePerformance !== null)
        .map((course) => ({
          value: course.averagePerformance,
          weight: 1,
        })),
    );

    return {
      institutionId,
      academicPeriodId: query.academicPeriodId,
      institutionAverage:
        institutionAverage === null
          ? null
          : applyRounding(
              institutionAverage,
              config.institution.roundingStrategy,
              config.institution.decimalPlaces,
            ),
      courseCount: courses.length,
      courses: courseSummaries.map((course) => ({
        ...course,
        averagePerformance:
          course.averagePerformance === null
            ? null
            : applyRounding(
                course.averagePerformance,
                config.institution.roundingStrategy,
                config.institution.decimalPlaces,
              ),
      })),
    };
  }

  async getAdminCoursePerformance(
    actor: AuthenticatedUser,
    query: AdminCoursePerformanceQueryDto,
  ): Promise<AdminCoursePerformanceResponseDto> {
    this.logCalculationRequest('ADMIN_COURSE_PERFORMANCE', actor, query);

    if (!RoleUtils.isSuperAdmin(actor.role) && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const coursePerformance = await this.getTeacherCourseAverages(actor, query);
    const subjectAverages = coursePerformance.subjects
      .map((subject) => subject.classAverage)
      .filter((average): average is number => average !== null);

    const course = await assertTeacherCanAccessCourse(
      this.prisma,
      actor,
      query.courseId,
      query.academicPeriodId,
    );

    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      course.institutionId,
      query.academicPeriodId,
    );

    const courseAverage = computeWeightedAverage(
      subjectAverages.map((average) => ({ value: average, weight: 1 })),
    );

    return {
      courseId: query.courseId,
      courseName: course.courseName,
      academicPeriodId: query.academicPeriodId,
      courseAverage:
        courseAverage === null
          ? null
          : applyRounding(
              courseAverage,
              config.institution.roundingStrategy,
              config.institution.decimalPlaces,
            ),
      subjects: coursePerformance.subjects,
    };
  }

  async getAdminStudentPerformance(
    actor: AuthenticatedUser,
    query: AdminStudentPerformanceQueryDto,
  ): Promise<AdminStudentPerformanceResponseDto> {
    this.logCalculationRequest('ADMIN_STUDENT_PERFORMANCE', actor, query);

    if (!RoleUtils.isSuperAdmin(actor.role) && actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return this.getTeacherStudentPerformance(actor, query);
  }

  private buildSubjectAveragesForEnrollment(
    enrollmentId: string,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<SubjectAverageResponseDto[]> {
    return this.getEnrollmentSubjectAverages(
      enrollmentId,
      institutionId,
      academicPeriodId,
    );
  }

  /**
   * Calculates all subject results for an enrollment in one bulk grade query.
   * `courseId` additionally includes assigned subjects that do not yet have grades.
   */
  async getEnrollmentSubjectAverages(
    enrollmentId: string,
    institutionId: string,
    academicPeriodId: string,
    courseId?: string,
  ): Promise<SubjectAverageResponseDto[]> {
    const config = await resolveCalculationConfig(
      this.prisma,
      this.logger,
      institutionId,
      academicPeriodId,
    );

    const grades = await loadGradesForEnrollment(
      this.prisma,
      enrollmentId,
      academicPeriodId,
    );

    const gradedSubjects = await loadDistinctSubjectsForEnrollment(
      this.prisma,
      enrollmentId,
      academicPeriodId,
    );

    const assignedSubjects = courseId
      ? await this.prisma.teacherAssignment.findMany({
          where: { courseId, academicPeriodId },
          select: {
            subjectId: true,
            subject: { select: { name: true } },
          },
          orderBy: { subject: { name: 'asc' } },
        })
      : [];

    const subjects = new Map<
      string,
      { subjectId: string; subjectName: string }
    >();
    for (const subject of gradedSubjects) {
      subjects.set(subject.subjectId, subject);
    }
    for (const assignment of assignedSubjects) {
      subjects.set(assignment.subjectId, {
        subjectId: assignment.subjectId,
        subjectName: assignment.subject.name,
      });
    }

    return [...subjects.values()]
      .sort((left, right) => left.subjectName.localeCompare(right.subjectName))
      .map((subject) => {
        const result = computeSubjectAverage(
          grades,
          subject.subjectId,
          subject.subjectName,
          config.academicTerms,
          config.categories,
          config.institution,
        );

        return {
          subjectId: result.subjectId,
          subjectName: result.subjectName,
          average: result.average,
          isPassing: isPassing(result.average, config.institution.passingScore),
          terms: result.terms,
        };
      });
  }

  private logCalculationRequest(
    event: string,
    actor: AuthenticatedUser,
    query: {
      academicPeriodId: string;
      courseId?: string;
      subjectId?: string;
      studentId?: string;
      institutionId?: string;
    },
  ): void {
    this.logger.log({
      context: ACADEMIC_PERFORMANCE_CONTEXT,
      event,
      message: 'Academic performance calculation requested',
      userId: actor.id,
      metadata: {
        actorRole: actor.role,
        academicPeriodId: query.academicPeriodId,
        courseId: query.courseId,
        subjectId: query.subjectId,
        studentId: query.studentId,
        institutionId: query.institutionId,
      },
    });
  }
}
