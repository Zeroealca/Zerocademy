import { Grade, Prisma } from '@prisma/client';
import { decimalToNumber } from '../../academic-evaluation/academic-evaluation.validation';
import { GradeResponseDto } from '../dto/grade-response.dto';
import { toAssessmentResponseDto } from './assessment.mapper';

export const gradeWithRelationsInclude = {
  enrollment: {
    select: {
      id: true,
      studentId: true,
      student: {
        select: {
          id: true,
          userId: true,
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  },
  assessment: {
    include: {
      academicPeriod: { select: { id: true, name: true } },
      academicTerm: { select: { id: true, name: true, order: true } },
      subject: { select: { id: true, name: true, code: true } },
      assessmentCategory: { select: { id: true, name: true } },
      teacherAssignment: { select: { id: true, courseId: true, teacherId: true } },
    },
  },
} as const satisfies Prisma.GradeInclude;

export type GradeWithRelations = Prisma.GradeGetPayload<{
  include: typeof gradeWithRelationsInclude;
}>;

export function toGradeResponseDto(grade: GradeWithRelations): GradeResponseDto {
  const student = grade.enrollment.student;

  return {
    id: grade.id,
    assessmentId: grade.assessmentId,
    enrollmentId: grade.enrollmentId,
    studentId: grade.enrollment.studentId,
    studentFirstName: student.user.firstName,
    studentLastName: student.user.lastName,
    score: decimalToNumber(grade.score),
    observations: grade.observations,
    gradingSchemeId: grade.gradingSchemeId,
    assessment: toAssessmentResponseDto(grade.assessment),
    createdAt: grade.createdAt.toISOString(),
    updatedAt: grade.updatedAt.toISOString(),
  };
}
