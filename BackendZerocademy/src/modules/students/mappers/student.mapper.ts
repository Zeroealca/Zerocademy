import type { Gender, StudentProfile, User } from '@prisma/client';
import { StudentResponseDto } from '../dto/student-response.dto';

export type StudentWithUser = StudentProfile & {
  user: Pick<
    User,
    'email' | 'firstName' | 'lastName' | 'isActive' | 'deletedAt'
  >;
};

export function toStudentResponseDto(student: StudentWithUser): StudentResponseDto {
  return {
    id: student.id,
    userId: student.userId,
    registrationNumber: student.registrationNumber,
    email: student.user.email,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    institutionId: student.institutionId,
    nationalId: student.nationalId,
    birthDate: student.birthDate?.toISOString().slice(0, 10) ?? null,
    gender: student.gender as Gender | null,
    phone: student.phone,
    address: student.address,
    emergencyContact: student.emergencyContact,
    isActive: student.isActive,
    userIsActive: student.user.isActive,
    createdAt: student.createdAt.toISOString(),
    updatedAt: student.updatedAt.toISOString(),
  };
}

export const studentWithUserSelect = {
  id: true,
  userId: true,
  registrationNumber: true,
  institutionId: true,
  nationalId: true,
  birthDate: true,
  gender: true,
  phone: true,
  address: true,
  emergencyContact: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      deletedAt: true,
    },
  },
} as const;
