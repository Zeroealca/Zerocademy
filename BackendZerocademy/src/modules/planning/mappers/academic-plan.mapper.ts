import {
  AcademicPlan,
  AcademicPeriod,
  AcademicTerm,
  Course,
  Subject,
  TeacherAssignment,
  TeacherProfile,
  User,
} from '@prisma/client';
import { AcademicPlanResponseDto } from '../dto/academic-plan-response.dto';

type AcademicPlanWithRelations = AcademicPlan & {
  academicTerm: Pick<AcademicTerm, 'id' | 'name' | 'order'>;
  teacherAssignment: Pick<
    TeacherAssignment,
    | 'id'
    | 'teacherId'
    | 'institutionId'
    | 'courseId'
    | 'subjectId'
    | 'academicPeriodId'
  > & {
    academicPeriod: Pick<AcademicPeriod, 'id' | 'name' | 'status'>;
    course: Pick<Course, 'id' | 'name' | 'section'>;
    subject: Pick<Subject, 'id' | 'name' | 'code'>;
    teacher: Pick<TeacherProfile, 'id'> & {
      user: Pick<User, 'firstName' | 'lastName'>;
    };
  };
};

export const academicPlanInclude = {
  academicTerm: { select: { id: true, name: true, order: true } },
  teacherAssignment: {
    select: {
      id: true,
      teacherId: true,
      institutionId: true,
      courseId: true,
      subjectId: true,
      academicPeriodId: true,
      academicPeriod: { select: { id: true, name: true, status: true } },
      course: { select: { id: true, name: true, section: true } },
      subject: { select: { id: true, name: true, code: true } },
      teacher: {
        select: {
          id: true,
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  },
} as const;

const dateOnly = (value: Date | null): string | null =>
  value?.toISOString().slice(0, 10) ?? null;

export function toAcademicPlanResponseDto(
  plan: AcademicPlanWithRelations,
): AcademicPlanResponseDto {
  const assignment = plan.teacherAssignment;
  return {
    id: plan.id,
    teacherAssignmentId: plan.teacherAssignmentId,
    academicPeriodId: assignment.academicPeriodId,
    academicPeriodName: assignment.academicPeriod.name,
    academicPeriodStatus: assignment.academicPeriod.status,
    academicTermId: plan.academicTermId,
    academicTermName: plan.academicTerm.name,
    academicTermOrder: plan.academicTerm.order,
    courseId: assignment.courseId,
    courseName: assignment.course.name,
    courseSection: assignment.course.section,
    subjectId: assignment.subjectId,
    subjectName: assignment.subject.name,
    subjectCode: assignment.subject.code,
    teacherId: assignment.teacherId,
    teacherFirstName: assignment.teacher.user.firstName,
    teacherLastName: assignment.teacher.user.lastName,
    title: plan.title,
    description: plan.description,
    startDate: dateOnly(plan.startDate),
    endDate: dateOnly(plan.endDate),
    objectives: plan.objectives,
    contents: plan.contents,
    activities: plan.activities,
    resources: plan.resources,
    evaluationNotes: plan.evaluationNotes,
    notes: plan.notes,
    status: plan.status,
    createdByUserId: plan.createdByUserId,
    publishedAt: plan.publishedAt?.toISOString() ?? null,
    publishedByUserId: plan.publishedByUserId,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString(),
  };
}
