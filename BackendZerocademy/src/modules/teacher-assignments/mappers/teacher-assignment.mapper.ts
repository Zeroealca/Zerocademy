import {
  AcademicPeriod,
  Course,
  Subject,
  TeacherAssignment,
  TeacherProfile,
  User,
} from '@prisma/client';
import { TeacherAssignmentResponseDto } from '../dto/teacher-assignment-response.dto';

export type TeacherAssignmentWithRelations = TeacherAssignment & {
  teacher: TeacherProfile & { user: Pick<User, 'firstName' | 'lastName'> };
  subject: Subject;
  course: Course;
  academicPeriod: AcademicPeriod;
};

export const teacherAssignmentInclude = {
  teacher: {
    include: {
      user: { select: { firstName: true, lastName: true } },
    },
  },
  subject: true,
  course: true,
  academicPeriod: true,
} as const;

export function toTeacherAssignmentResponseDto(
  assignment: TeacherAssignmentWithRelations,
): TeacherAssignmentResponseDto {
  return {
    id: assignment.id,
    institutionId: assignment.institutionId ?? null,
    teacherId: assignment.teacherId,
    teacherFirstName: assignment.teacher.user.firstName,
    teacherLastName: assignment.teacher.user.lastName,
    subjectId: assignment.subjectId,
    subjectName: assignment.subject.name,
    subjectCode: assignment.subject.code,
    courseId: assignment.courseId,
    courseName: assignment.course.name,
    academicPeriodId: assignment.academicPeriodId,
    academicPeriodName: assignment.academicPeriod.name,
    createdAt: assignment.createdAt.toISOString(),
    updatedAt: assignment.updatedAt.toISOString(),
  };
}
