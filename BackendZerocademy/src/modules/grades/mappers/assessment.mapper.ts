import {
  AcademicPeriod,
  AcademicTerm,
  Assessment,
  AssessmentCategory,
  Subject,
  TeacherAssignment,
} from '@prisma/client';
import { decimalToNumber } from '../../academic-evaluation/academic-evaluation.validation';
import { AssessmentResponseDto } from '../dto/assessment-response.dto';

export type AssessmentWithRelations = Assessment & {
  academicPeriod: Pick<AcademicPeriod, 'id' | 'name'>;
  academicTerm: Pick<AcademicTerm, 'id' | 'name' | 'order'>;
  subject: Pick<Subject, 'id' | 'name' | 'code'>;
  assessmentCategory: Pick<AssessmentCategory, 'id' | 'name'>;
  teacherAssignment: Pick<TeacherAssignment, 'id' | 'courseId' | 'teacherId'>;
};

export const assessmentInclude = {
  academicPeriod: { select: { id: true, name: true } },
  academicTerm: { select: { id: true, name: true, order: true } },
  subject: { select: { id: true, name: true, code: true } },
  assessmentCategory: { select: { id: true, name: true } },
  teacherAssignment: { select: { id: true, courseId: true, teacherId: true } },
} as const;

export function toAssessmentResponseDto(
  assessment: AssessmentWithRelations,
): AssessmentResponseDto {
  return {
    id: assessment.id,
    institutionId: assessment.institutionId,
    academicPeriodId: assessment.academicPeriodId,
    academicPeriodName: assessment.academicPeriod.name,
    academicTermId: assessment.academicTermId,
    academicTermName: assessment.academicTerm.name,
    academicTermOrder: assessment.academicTerm.order,
    subjectId: assessment.subjectId,
    subjectName: assessment.subject.name,
    subjectCode: assessment.subject.code,
    teacherAssignmentId: assessment.teacherAssignmentId,
    courseId: assessment.teacherAssignment.courseId,
    assessmentCategoryId: assessment.assessmentCategoryId,
    assessmentCategoryName: assessment.assessmentCategory.name,
    title: assessment.title,
    description: assessment.description,
    maxScore: decimalToNumber(assessment.maxScore),
    weight: decimalToNumber(assessment.weight),
    assessmentDate: assessment.assessmentDate.toISOString().slice(0, 10),
    createdAt: assessment.createdAt.toISOString(),
    updatedAt: assessment.updatedAt.toISOString(),
  };
}
