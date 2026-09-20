import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  EnrollmentStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { decimalToNumber } from '../academic-evaluation/academic-evaluation.validation';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { RoleUtils } from '../../common/rbac/role.utils';

export interface GradingSchemeBounds {
  gradingSchemeId: string;
  minScore: number;
  maxScore: number;
  decimalPlaces: number;
}

export async function resolveInstitutionGradingBounds(
  prisma: PrismaService,
  institutionId: string,
): Promise<GradingSchemeBounds> {
  const config = await prisma.institutionAcademicConfiguration.findUnique({
    where: { institutionId },
    include: { gradingScheme: true },
  });

  if (!config?.gradingScheme.isActive) {
    throw new BadRequestException(
      'Institution academic evaluation configuration is not set',
    );
  }

  return {
    gradingSchemeId: config.gradingSchemeId,
    minScore: decimalToNumber(config.gradingScheme.minScore),
    maxScore: decimalToNumber(config.gradingScheme.maxScore),
    decimalPlaces: config.decimalPlaces,
  };
}

export function assertScoreWithinAssessmentMax(
  score: number,
  maxScore: number,
): void {
  if (score < 0) {
    throw new BadRequestException('Score cannot be negative');
  }

  if (score > maxScore) {
    throw new BadRequestException(
      `Score cannot exceed the assessment maximum (${maxScore})`,
    );
  }
}

export function assertScoreWithinGradingScheme(
  score: number,
  bounds: GradingSchemeBounds,
): void {
  if (score < bounds.minScore || score > bounds.maxScore) {
    throw new BadRequestException(
      `Score must be between ${bounds.minScore} and ${bounds.maxScore}`,
    );
  }

  const factor = 10 ** bounds.decimalPlaces;
  const rounded = Math.round(score * factor) / factor;

  if (Math.abs(score - rounded) > 1e-9) {
    throw new BadRequestException(
      `Score must have at most ${bounds.decimalPlaces} decimal places`,
    );
  }
}

export function mapPrismaGradeConflict(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(
      'A grade already exists for this student on this assessment',
    );
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2003'
  ) {
    throw new BadRequestException('Invalid assessment or enrollment reference');
  }

  throw error;
}

export async function assertTeacherOwnsAssignment(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  teacherAssignmentId: string,
): Promise<{
  id: string;
  institutionId: string | null;
  teacherId: string;
  subjectId: string;
  courseId: string;
  academicPeriodId: string;
}> {
  if (actor.role !== Role.TEACHER || !actor.profileId) {
    throw new ForbiddenException('Only teachers can manage assessments and grades');
  }

  const assignment = await prisma.teacherAssignment.findUnique({
    where: { id: teacherAssignmentId },
    select: {
      id: true,
      institutionId: true,
      teacherId: true,
      subjectId: true,
      courseId: true,
      academicPeriodId: true,
    },
  });

  if (!assignment) {
    throw new NotFoundException('Teacher assignment not found');
  }

  if (assignment.teacherId !== actor.profileId) {
    throw new ForbiddenException('Teacher assignment is not assigned to you');
  }

  return assignment;
}

export async function assertAssessmentKeysValid(
  prisma: PrismaService,
  keys: {
    institutionId: string;
    academicPeriodId: string;
    academicTermId: string;
    subjectId: string;
    teacherAssignmentId: string;
    assessmentCategoryId: string;
    maxScore: number;
    weight: number;
  },
): Promise<void> {
  const assignment = await prisma.teacherAssignment.findUnique({
    where: { id: keys.teacherAssignmentId },
    select: {
      institutionId: true,
      subjectId: true,
      courseId: true,
      academicPeriodId: true,
    },
  });

  if (!assignment) {
    throw new BadRequestException('Teacher assignment not found');
  }

  if (assignment.subjectId !== keys.subjectId) {
    throw new BadRequestException(
      'Subject does not match the teacher assignment',
    );
  }

  if (assignment.academicPeriodId !== keys.academicPeriodId) {
    throw new BadRequestException(
      'Academic period does not match the teacher assignment',
    );
  }

  if (
    assignment.institutionId &&
    assignment.institutionId !== keys.institutionId
  ) {
    throw new BadRequestException(
      'Institution does not match the teacher assignment',
    );
  }

  const term = await prisma.academicTerm.findUnique({
    where: { id: keys.academicTermId },
    select: { academicPeriodId: true },
  });

  if (!term || term.academicPeriodId !== keys.academicPeriodId) {
    throw new BadRequestException(
      'Academic term does not belong to the selected academic period',
    );
  }

  const category = await prisma.assessmentCategory.findUnique({
    where: { id: keys.assessmentCategoryId },
    select: { institutionId: true, isActive: true },
  });

  if (!category?.isActive) {
    throw new BadRequestException('Assessment category not found or inactive');
  }

  if (category.institutionId !== keys.institutionId) {
    throw new BadRequestException(
      'Assessment category does not belong to the institution',
    );
  }

  const bounds = await resolveInstitutionGradingBounds(
    prisma,
    keys.institutionId,
  );

  assertScoreWithinAssessmentMax(keys.maxScore, bounds.maxScore);

  if (keys.weight <= 0 || keys.weight > 100) {
    throw new BadRequestException('Weight must be greater than 0 and at most 100');
  }
}

export async function assertEnrollmentEligibleForAssessment(
  prisma: PrismaService,
  enrollmentId: string,
  assessment: {
    teacherAssignment: { courseId: string; academicPeriodId: string };
  },
): Promise<{ id: string; studentId: string }> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      id: true,
      studentId: true,
      courseId: true,
      academicPeriodId: true,
      status: true,
    },
  });

  if (!enrollment) {
    throw new BadRequestException('Enrollment not found');
  }

  if (enrollment.status !== EnrollmentStatus.ACTIVE) {
    throw new BadRequestException('Enrollment is not active');
  }

  if (
    enrollment.courseId !== assessment.teacherAssignment.courseId ||
    enrollment.academicPeriodId !==
      assessment.teacherAssignment.academicPeriodId
  ) {
    throw new BadRequestException(
      'Enrollment does not belong to the assessment course and period',
    );
  }

  return { id: enrollment.id, studentId: enrollment.studentId };
}

export async function assertActorCanAccessAssessment(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  assessment: {
    institutionId: string;
    teacherAssignment: { teacherId: string };
  },
): Promise<void> {
  if (RoleUtils.isSuperAdmin(actor.role)) {
    return;
  }

  if (actor.role === Role.ADMIN) {
    const institutionId = await resolveActorInstitutionId(prisma, actor);
    if (institutionId && institutionId !== assessment.institutionId) {
      throw new NotFoundException('Assessment not found');
    }
    return;
  }

  if (actor.role === Role.TEACHER) {
    if (
      !actor.profileId ||
      assessment.teacherAssignment.teacherId !== actor.profileId
    ) {
      throw new NotFoundException('Assessment not found');
    }
    return;
  }

  throw new ForbiddenException('Assessment access denied');
}

export async function assertActorCanAccessGrade(
  prisma: PrismaService,
  actor: AuthenticatedUser,
  grade: {
    enrollment: { student: { id: string; userId: string } };
    assessment: {
      institutionId: string;
      teacherAssignment: { teacherId: string };
    };
  },
): Promise<void> {
  if (RoleUtils.isSuperAdmin(actor.role)) {
    return;
  }

  if (actor.role === Role.STUDENT) {
    if (grade.enrollment.student.userId !== actor.id) {
      throw new NotFoundException('Grade not found');
    }
    return;
  }

  if (actor.role === Role.REPRESENTATIVE) {
    const relationship = await prisma.representativeStudent.findFirst({
      where: {
        representativeUserId: actor.id,
        studentId: grade.enrollment.student.id,
        isActive: true,
      },
      select: { id: true },
    });
    if (!relationship) throw new NotFoundException('Grade not found');
    return;
  }

  if (actor.role === Role.ADMIN) {
    const institutionId = await resolveActorInstitutionId(prisma, actor);
    if (
      institutionId &&
      institutionId !== grade.assessment.institutionId
    ) {
      throw new NotFoundException('Grade not found');
    }
    return;
  }

  if (actor.role === Role.TEACHER) {
    if (
      !actor.profileId ||
      grade.assessment.teacherAssignment.teacherId !== actor.profileId
    ) {
      throw new NotFoundException('Grade not found');
    }
    return;
  }

  throw new ForbiddenException('Grade access denied');
}

export function decimalFromInput(value: number): Decimal {
  return new Decimal(value);
}
