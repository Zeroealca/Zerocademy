import { Prisma } from '@prisma/client';
import { EnrollmentResponseDto } from '../dto/enrollment-response.dto';

export const enrollmentWithRelationsSelect = {
  id: true,
  studentId: true,
  courseId: true,
  academicPeriodId: true,
  enrollmentDate: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  student: {
    select: {
      id: true,
      userId: true,
      institutionId: true,
      nationalId: true,
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  },
  course: {
    select: { id: true, name: true, section: true },
  },
  academicPeriod: {
    select: { id: true, name: true },
  },
} as const;

export type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  select: typeof enrollmentWithRelationsSelect;
}>;

export function toEnrollmentResponseDto(
  enrollment: EnrollmentWithRelations,
): EnrollmentResponseDto {
  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    academicPeriodId: enrollment.academicPeriodId,
    enrollmentDate: enrollment.enrollmentDate.toISOString().slice(0, 10),
    status: enrollment.status,
    student: {
      id: enrollment.student.id,
      userId: enrollment.student.userId,
      nationalId: enrollment.student.nationalId,
      firstName: enrollment.student.user.firstName,
      lastName: enrollment.student.user.lastName,
      email: enrollment.student.user.email,
    },
    course: {
      id: enrollment.course.id,
      name: enrollment.course.name,
      section: enrollment.course.section,
    },
    academicPeriod: {
      id: enrollment.academicPeriod.id,
      name: enrollment.academicPeriod.name,
    },
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}
