/* eslint-disable @typescript-eslint/only-throw-error -- NestJS HTTP exceptions are the application's error contract. */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { assertActorCanAccessInstitution } from '../../common/rbac/academic-scope.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AcademicPerformanceService } from '../academic-performance/academic-performance.service';
import { assertTeacherCanAccessCourse } from '../academic-performance/academic-performance.validation';
import { assertActorCanAccessStudent } from '../students/student-scope.util';
import { computeWeightedAverage } from '../academic-performance/grade-calculation/grade-calculation.engine';
import { resolveCalculationConfig } from '../academic-performance/grade-calculation/grade-calculation.config-resolver';
import { applyRounding } from '../academic-performance/grade-calculation/rounding.util';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { REPORT_CARDS_CONTEXT } from './constants';
import type { ReportCardQueryDto } from './dto/report-card-query.dto';
import type {
  ReportCardQualitativeResultDto,
  ReportCardResponseDto,
} from './dto/report-card-response.dto';

@Injectable()
export class ReportCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly academicPerformanceService: AcademicPerformanceService,
    private readonly logger: AppLoggerService,
  ) {}

  getMyReportCard(
    actor: AuthenticatedUser,
    query: ReportCardQueryDto,
  ): Promise<ReportCardResponseDto> {
    if (actor.role !== Role.STUDENT || !actor.profileId) {
      throw new ForbiddenException('Student access required');
    }

    return this.buildReportCard(actor, actor.profileId, query.academicPeriodId);
  }

  getStudentReportCard(
    actor: AuthenticatedUser,
    studentId: string,
    query: ReportCardQueryDto,
  ): Promise<ReportCardResponseDto> {
    if (actor.role === Role.STUDENT) {
      throw new ForbiddenException(
        'Students can only access their own report card',
      );
    }
    return this.buildReportCard(actor, studentId, query.academicPeriodId);
  }

  private async buildReportCard(
    actor: AuthenticatedUser,
    studentId: string,
    academicPeriodId: string,
  ): Promise<ReportCardResponseDto> {
    if (actor.role === Role.REPRESENTATIVE) {
      const student = await this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        select: { id: true, userId: true, institutionId: true },
      });
      if (!student) throw new NotFoundException('Student enrollment not found');
      await assertActorCanAccessStudent(this.prisma, actor, student);
    }
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { studentId, academicPeriodId },
      select: {
        id: true,
        studentId: true,
        student: {
          select: {
            nationalId: true,
            registrationNumber: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            section: true,
            institutionId: true,
            gradeLevel: { select: { name: true } },
          },
        },
        academicPeriod: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!enrollment?.course.institutionId) {
      throw new NotFoundException('Student enrollment not found');
    }

    await this.assertAccess(
      actor,
      enrollment.course.id,
      enrollment.course.institutionId,
      academicPeriodId,
    );

    const [subjectAverages, config, scheme] = await Promise.all([
      this.academicPerformanceService.getEnrollmentSubjectAverages(
        enrollment.id,
        enrollment.course.institutionId,
        academicPeriodId,
        enrollment.course.id,
      ),
      resolveCalculationConfig(
        this.prisma,
        this.logger,
        enrollment.course.institutionId,
        academicPeriodId,
      ),
      this.resolveReportCardScheme(
        enrollment.id,
        academicPeriodId,
        enrollment.course.institutionId,
      ),
    ]);

    const scales = scheme.gradeScales.map((scale) => ({
      minValue: scale.minValue.toNumber(),
      maxValue: scale.maxValue.toNumber(),
      code: scale.code,
      description: scale.description,
    }));
    const subjectCodes = await this.prisma.subject.findMany({
      where: {
        id: { in: subjectAverages.map((subject) => subject.subjectId) },
      },
      select: { id: true, code: true },
    });
    const subjectCodeById = new Map(
      subjectCodes.map((subject) => [subject.id, subject.code]),
    );
    const gradedAverages = subjectAverages
      .filter((subject) => subject.average !== null)
      .map((subject) => ({ value: subject.average, weight: 1 }));
    const rawOverall = computeWeightedAverage(gradedAverages);
    const overallAverage =
      rawOverall === null
        ? null
        : applyRounding(
            rawOverall,
            config.institution.roundingStrategy,
            config.institution.decimalPlaces,
          );

    this.logger.log({
      context: REPORT_CARDS_CONTEXT,
      event: 'REPORT_CARD_RETRIEVED',
      message: 'Report card retrieved',
      userId: actor.id,
      metadata: { studentId, enrollmentId: enrollment.id, academicPeriodId },
    });

    return {
      enrollmentId: enrollment.id,
      student: {
        id: enrollment.studentId,
        fullName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        nationalId: enrollment.student.nationalId,
        registrationNumber: enrollment.student.registrationNumber,
      },
      institution: {
        id: enrollment.course.institutionId,
        name: scheme.institution.name,
        logoUrl: scheme.institution.logoUrl,
        primaryColor: scheme.institution.primaryColor,
        secondaryColor: scheme.institution.secondaryColor,
      },
      academicPeriod: {
        id: enrollment.academicPeriod.id,
        name: enrollment.academicPeriod.name,
        startDate: enrollment.academicPeriod.startDate.toISOString(),
        endDate: enrollment.academicPeriod.endDate.toISOString(),
      },
      enrollment: {
        courseId: enrollment.course.id,
        courseName: enrollment.course.name,
        section: enrollment.course.section,
        gradeLevelName: enrollment.course.gradeLevel.name,
      },
      subjects: subjectAverages.map((subject) => ({
        id: subject.subjectId,
        name: subject.subjectName,
        code: subjectCodeById.get(subject.subjectId) ?? '',
        terms: subject.terms.map((term) => ({
          id: term.academicTermId,
          name: term.academicTermName,
          order: term.order,
          average: term.average,
          qualitativeResult: this.resolveQualitativeResult(
            term.average,
            scales,
          ),
        })),
        average: subject.average,
        qualitativeResult: this.resolveQualitativeResult(
          subject.average,
          scales,
        ),
      })),
      overallAverage,
      overallQualitativeResult: this.resolveQualitativeResult(
        overallAverage,
        scales,
      ),
    };
  }

  private async assertAccess(
    actor: AuthenticatedUser,
    courseId: string,
    institutionId: string,
    academicPeriodId: string,
  ): Promise<void> {
    if (actor.role === Role.STUDENT) {
      return;
    }
    if (actor.role === Role.REPRESENTATIVE) return;
    if (actor.role === Role.TEACHER) {
      await assertTeacherCanAccessCourse(
        this.prisma,
        actor,
        courseId,
        academicPeriodId,
      );
      return;
    }
    await assertActorCanAccessInstitution(this.prisma, actor, institutionId);
  }

  private async resolveReportCardScheme(
    enrollmentId: string,
    academicPeriodId: string,
    institutionId: string,
  ) {
    const snapshotSchemes = await this.prisma.grade.findMany({
      where: {
        enrollmentId,
        assessment: { academicPeriodId },
        gradingSchemeId: { not: null },
      },
      distinct: ['gradingSchemeId'],
      select: { gradingSchemeId: true },
    });
    const snapshotSchemeId =
      snapshotSchemes.length === 1 ? snapshotSchemes[0].gradingSchemeId : null;
    const configuration = snapshotSchemeId
      ? null
      : await this.prisma.institutionAcademicConfiguration.findUnique({
          where: { institutionId },
          select: { gradingSchemeId: true },
        });
    const gradingSchemeId = snapshotSchemeId ?? configuration?.gradingSchemeId;

    if (!gradingSchemeId) {
      throw new NotFoundException('Grading scheme not found');
    }

    const scheme = await this.prisma.gradingScheme.findUnique({
      where: { id: gradingSchemeId },
      include: {
        gradeScales: { orderBy: { order: 'asc' } },
        institution: {
          select: {
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });
    if (!scheme || !scheme.institution) {
      throw new NotFoundException('Grading scheme not found');
    }
    return { gradeScales: scheme.gradeScales, institution: scheme.institution };
  }

  private resolveQualitativeResult(
    average: number | null,
    scales: Array<{
      minValue: number;
      maxValue: number;
      code: string;
      description: string;
    }>,
  ): ReportCardQualitativeResultDto | null {
    if (average === null) return null;
    const scale = scales.find(
      (candidate) =>
        average >= candidate.minValue && average <= candidate.maxValue,
    );
    return scale ? { code: scale.code, description: scale.description } : null;
  }
}
