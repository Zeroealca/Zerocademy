import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnrollmentStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppConfig } from '../../config/configuration';
import { resolveActorInstitutionId } from '../../common/rbac/academic-scope.util';
import { ProfileProvisioningService } from '../../common/rbac/profile-provisioning.service';
import { AppLoggerService } from '../../common/logger/app-logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import {
  findDuplicateCsvRows,
  parseStudentCsvContent,
  type ParsedStudentCsvRow,
} from './csv/student-csv.parser';
import { STUDENT_BULK_IMPORT_CONTEXT } from './constants';
import { BulkImportResultDto } from './dto/bulk-import-result.dto';
import { BulkImportStudentsDto } from './dto/bulk-import-students.dto';

@Injectable()
export class StudentBulkImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: AppLoggerService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly profileProvisioning: ProfileProvisioningService,
  ) {}

  async importFromCsv(
    actor: AuthenticatedUser,
    dto: BulkImportStudentsDto,
  ): Promise<BulkImportResultDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      select: {
        id: true,
        isActive: true,
        academicPeriodId: true,
        institutionId: true,
      },
    });

    if (!course?.isActive) {
      throw new BadRequestException('Course not found or inactive');
    }

    if (course.academicPeriodId !== dto.academicPeriodId) {
      throw new BadRequestException(
        'Course does not belong to the selected academic period',
      );
    }

    const period = await this.prisma.academicPeriod.findUnique({
      where: { id: dto.academicPeriodId },
      select: { id: true, isActive: true },
    });

    if (!period) {
      throw new BadRequestException('Academic period not found');
    }

    const institutionId =
      course.institutionId ??
      (await resolveActorInstitutionId(this.prisma, actor));

    const { rows, failures: parseFailures } = parseStudentCsvContent(
      dto.csvContent,
    );
    const duplicateFailures = findDuplicateCsvRows(rows);

    const result: BulkImportResultDto = {
      importedCount: 0,
      skippedCount: 0,
      failedCount: parseFailures.length + duplicateFailures.length,
      errors: [
        ...parseFailures.map((failure) => ({
          row: failure.rowNumber,
          email: '',
          message: failure.message,
        })),
        ...duplicateFailures.map((failure) => ({
          row: failure.rowNumber,
          email: '',
          message: failure.message,
        })),
      ],
      duplicateWarnings: [],
    };

    const enrollmentDate = new Date();

    for (const row of rows) {
      if (
        result.errors.some(
          (error) =>
            error.row === row.rowNumber &&
            !error.message.includes('Duplicate'),
        )
      ) {
        continue;
      }

      try {
        const outcome = await this.importRow({
          row,
          institutionId,
          courseId: dto.courseId,
          academicPeriodId: dto.academicPeriodId,
          enrollmentDate,
        });

        if (outcome === 'imported') {
          result.importedCount += 1;
        } else if (outcome === 'skipped') {
          result.skippedCount += 1;
        }
      } catch (error) {
        result.failedCount += 1;
        result.errors.push({
          row: row.rowNumber,
          email: row.email,
          message:
            error instanceof Error ? error.message : 'Import failed for row',
        });

        this.logger.warn({
          context: STUDENT_BULK_IMPORT_CONTEXT,
          event: 'BULK_IMPORT_ROW_FAILED',
          message: 'CSV row import failed',
          metadata: { row: row.rowNumber, email: row.email },
        });
      }
    }

    this.logger.log({
      context: STUDENT_BULK_IMPORT_CONTEXT,
      event: 'BULK_IMPORT_COMPLETED',
      message: 'Student CSV import finished',
      metadata: {
        actorId: actor.id,
        courseId: dto.courseId,
        academicPeriodId: dto.academicPeriodId,
        importedCount: result.importedCount,
        skippedCount: result.skippedCount,
        failedCount: result.failedCount,
      },
    });

    return result;
  }

  private buildStudentProfileData(row: ParsedStudentCsvRow, institutionId?: string) {
    return {
      institutionId,
      nationalId: row.nationalId,
      isActive: true,
      ...(row.birthDate ? { birthDate: new Date(row.birthDate) } : {}),
      ...(row.gender ? { gender: row.gender } : {}),
      ...(row.phone ? { phone: row.phone.trim() } : {}),
      ...(row.address ? { address: row.address.trim() } : {}),
      ...(row.emergencyContact
        ? { emergencyContact: row.emergencyContact.trim() }
        : {}),
    };
  }

  private async importRow(params: {
    row: ParsedStudentCsvRow;
    institutionId?: string;
    courseId: string;
    academicPeriodId: string;
    enrollmentDate: Date;
  }): Promise<'imported' | 'skipped'> {
    const { row, institutionId, courseId, academicPeriodId, enrollmentDate } =
      params;

    const existingNational = await this.prisma.studentProfile.findFirst({
      where: { nationalId: row.nationalId },
      select: { id: true, userId: true },
    });

    if (existingNational) {
      const enrollmentExists = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId_academicPeriodId: {
            studentId: existingNational.id,
            courseId,
            academicPeriodId,
          },
        },
      });

      if (enrollmentExists) {
        return 'skipped';
      }

      await this.prisma.enrollment.create({
        data: {
          studentId: existingNational.id,
          courseId,
          academicPeriodId,
          enrollmentDate,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      return 'imported';
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: row.email },
      include: { studentProfile: true },
    });

    if (existingUser) {
      if (existingUser.role !== Role.STUDENT || !existingUser.studentProfile) {
        throw new Error('Email already exists for a non-student account');
      }

      const enrollmentExists = await this.prisma.enrollment.findUnique({
        where: {
          studentId_courseId_academicPeriodId: {
            studentId: existingUser.studentProfile.id,
            courseId,
            academicPeriodId,
          },
        },
      });

      if (enrollmentExists) {
        return 'skipped';
      }

      await this.prisma.enrollment.create({
        data: {
          studentId: existingUser.studentProfile.id,
          courseId,
          academicPeriodId,
          enrollmentDate,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      return 'imported';
    }

    const passwordHash = await this.hashPassword(row.password);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: row.email,
          passwordHash,
          firstName: row.firstName,
          lastName: row.lastName,
          role: Role.STUDENT,
          isActive: true,
        },
      });

      await this.profileProvisioning.provisionForUser(
        user.id,
        Role.STUDENT,
        institutionId,
        tx,
      );

      const student = await tx.studentProfile.update({
        where: { userId: user.id },
        data: this.buildStudentProfileData(row, institutionId),
      });

      await tx.enrollment.create({
        data: {
          studentId: student.id,
          courseId,
          academicPeriodId,
          enrollmentDate,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    });

    return 'imported';
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = this.configService.get('bcryptSaltRounds', {
      infer: true,
    });
    return bcrypt.hash(password, saltRounds);
  }
}
