import { EnrollmentStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { decimalToNumber } from '../../academic-evaluation/academic-evaluation.validation';
import type { GradeCalculationInput } from './grade-calculation.types';

export async function loadGradesForEnrollment(
  prisma: PrismaService,
  enrollmentId: string,
  academicPeriodId: string,
  filters?: { subjectId?: string; academicTermId?: string },
): Promise<GradeCalculationInput[]> {
  const grades = await prisma.grade.findMany({
    where: {
      enrollmentId,
      assessment: {
        academicPeriodId,
        ...(filters?.subjectId ? { subjectId: filters.subjectId } : {}),
        ...(filters?.academicTermId
          ? { academicTermId: filters.academicTermId }
          : {}),
      },
    },
    select: {
      score: true,
      enrollmentId: true,
      assessment: {
        select: {
          id: true,
          subjectId: true,
          academicTermId: true,
          maxScore: true,
          weight: true,
          assessmentCategoryId: true,
          subject: { select: { name: true } },
        },
      },
    },
  });

  return grades.map((grade) => ({
    enrollmentId: grade.enrollmentId,
    subjectId: grade.assessment.subjectId,
    subjectName: grade.assessment.subject.name,
    academicTermId: grade.assessment.academicTermId,
    assessmentCategoryId: grade.assessment.assessmentCategoryId,
    assessmentId: grade.assessment.id,
    assessmentWeight: decimalToNumber(grade.assessment.weight),
    assessmentMaxScore: decimalToNumber(grade.assessment.maxScore),
    score: decimalToNumber(grade.score),
  }));
}

export async function loadGradesForCourseEnrollments(
  prisma: PrismaService,
  courseId: string,
  academicPeriodId: string,
  filters?: { subjectId?: string },
): Promise<
  Array<{
    enrollmentId: string;
    studentId: string;
    studentName: string;
    grades: GradeCalculationInput[];
  }>
> {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      academicPeriodId,
      status: EnrollmentStatus.ACTIVE,
    },
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: [
      { student: { user: { lastName: 'asc' } } },
      { student: { user: { firstName: 'asc' } } },
    ],
  });

  const results = await Promise.all(
    enrollments.map(async (enrollment) => {
      const grades = await loadGradesForEnrollment(
        prisma,
        enrollment.id,
        academicPeriodId,
        filters,
      );

      return {
        enrollmentId: enrollment.id,
        studentId: enrollment.studentId,
        studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
        grades,
      };
    }),
  );

  return results;
}

export async function loadDistinctSubjectsForEnrollment(
  prisma: PrismaService,
  enrollmentId: string,
  academicPeriodId: string,
): Promise<Array<{ subjectId: string; subjectName: string }>> {
  const assessments = await prisma.assessment.findMany({
    where: {
      academicPeriodId,
      grades: { some: { enrollmentId } },
    },
    distinct: ['subjectId'],
    select: {
      subjectId: true,
      subject: { select: { name: true } },
    },
    orderBy: { subject: { name: 'asc' } },
  });

  return assessments.map((assessment) => ({
    subjectId: assessment.subjectId,
    subjectName: assessment.subject.name,
  }));
}
