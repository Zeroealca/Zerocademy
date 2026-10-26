import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  Prisma,
  Role,
  TimetableStatus,
  Weekday,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type {
  StudentTimetableListResponseDto,
  StudentTimetableResponseDto,
} from './dto/student-timetable.dto';
import { TeacherTimetableClock } from './teacher-timetable-clock.service';

const timetableInclude = Prisma.validator<Prisma.TimetableInclude>()({
  academicPeriod: { select: { name: true } },
  slots: {
    include: {
      scheduleBlock: {
        select: { id: true, position: true, startTime: true, endTime: true },
      },
      teacherAssignment: {
        select: {
          course: { select: { id: true, name: true } },
          subject: { select: { name: true } },
          teacher: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      },
    },
  },
});
type PublishedTimetable = Prisma.TimetableGetPayload<{
  include: typeof timetableInclude;
}>;

@Injectable()
export class StudentTimetablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clock: TeacherTimetableClock,
  ) {}

  studentWeekly(
    actor: AuthenticatedUser,
    academicPeriodId?: string,
  ): Promise<StudentTimetableListResponseDto> {
    return this.forStudent(this.requireStudent(actor), academicPeriodId);
  }
  studentToday(
    actor: AuthenticatedUser,
    academicPeriodId?: string,
    now = this.clock.now(),
  ): Promise<StudentTimetableListResponseDto> {
    return this.forStudent(
      this.requireStudent(actor),
      academicPeriodId,
      this.weekdayFor(now) ?? null,
    );
  }
  async representativeWeekly(
    actor: AuthenticatedUser,
    studentId: string,
    academicPeriodId?: string,
  ): Promise<StudentTimetableListResponseDto> {
    await this.requireLinkedStudent(actor, studentId);
    return this.forStudent(studentId, academicPeriodId);
  }
  async representativeToday(
    actor: AuthenticatedUser,
    studentId: string,
    academicPeriodId?: string,
    now = this.clock.now(),
  ): Promise<StudentTimetableListResponseDto> {
    await this.requireLinkedStudent(actor, studentId);
    return this.forStudent(
      studentId,
      academicPeriodId,
      this.weekdayFor(now) ?? null,
    );
  }

  private async forStudent(
    studentId: string,
    academicPeriodId?: string,
    weekday?: Weekday | null,
  ): Promise<StudentTimetableListResponseDto> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId,
        status: EnrollmentStatus.ACTIVE,
        ...(academicPeriodId ? { academicPeriodId } : {}),
      },
      select: {
        courseId: true,
        academicPeriodId: true,
        course: { select: { institutionId: true } },
      },
    });
    if (!enrollments.length) return { data: [] };
    const courseIds = enrollments.map((enrollment) => enrollment.courseId);
    const allowed = new Set(
      enrollments.map(
        (enrollment) =>
          `${enrollment.academicPeriodId}:${enrollment.course.institutionId ?? ''}:${enrollment.courseId}`,
      ),
    );
    const timetables = await this.prisma.timetable.findMany({
      where: {
        status: TimetableStatus.PUBLISHED,
        ...(academicPeriodId ? { academicPeriodId } : {}),
        slots: { some: { courseId: { in: courseIds } } },
      },
      include: timetableInclude,
      orderBy: { academicPeriod: { startDate: 'desc' } },
    });
    return {
      data: timetables
        .map((timetable) => this.map(timetable, allowed, weekday))
        .filter((timetable) => timetable.slots.length > 0),
    };
  }

  private requireStudent(actor: AuthenticatedUser): string {
    if (actor.role !== Role.STUDENT || !actor.profileId)
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new NotFoundException('Student timetable not found');
    return actor.profileId;
  }
  private async requireLinkedStudent(
    actor: AuthenticatedUser,
    studentId: string,
  ): Promise<void> {
    if (actor.role !== Role.REPRESENTATIVE)
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new NotFoundException('Student timetable not found');
    const relationship = await this.prisma.representativeStudent.findFirst({
      where: { representativeUserId: actor.id, studentId, isActive: true },
      select: { id: true },
    });
    if (!relationship)
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new NotFoundException('Student timetable not found');
  }
  private map(
    timetable: PublishedTimetable,
    allowed: Set<string>,
    weekday?: Weekday | null,
  ): StudentTimetableResponseDto {
    return {
      id: timetable.id,
      institutionId: timetable.institutionId,
      academicPeriodId: timetable.academicPeriodId,
      academicPeriodName: timetable.academicPeriod.name,
      slots: timetable.slots
        .filter(
          (slot) =>
            allowed.has(
              `${timetable.academicPeriodId}:${timetable.institutionId}:${slot.courseId}`,
            ) &&
            weekday !== null &&
            (!weekday || slot.dayOfWeek === weekday),
        )
        .sort(
          (left, right) =>
            left.scheduleBlock.position - right.scheduleBlock.position ||
            left.teacherAssignmentId.localeCompare(right.teacherAssignmentId),
        )
        .map((slot) => ({
          id: slot.id,
          teacherAssignmentId: slot.teacherAssignmentId,
          weekday: slot.dayOfWeek,
          scheduleBlockId: slot.scheduleBlockId,
          scheduleBlockPosition: slot.scheduleBlock.position,
          scheduleBlockStartTime: this.time(slot.scheduleBlock.startTime),
          scheduleBlockEndTime: this.time(slot.scheduleBlock.endTime),
          courseId: slot.teacherAssignment.course.id,
          courseName: slot.teacherAssignment.course.name,
          subjectName: slot.teacherAssignment.subject.name,
          teacherName: `${slot.teacherAssignment.teacher.user.firstName} ${slot.teacherAssignment.teacher.user.lastName}`,
        })),
    };
  }
  private weekdayFor(now: Date): Weekday | undefined {
    const value = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'America/Guayaquil',
    }).format(now);
    return (
      {
        Mon: Weekday.MON,
        Tue: Weekday.TUE,
        Wed: Weekday.WED,
        Thu: Weekday.THU,
        Fri: Weekday.FRI,
      } as Record<string, Weekday>
    )[value];
  }
  private time(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }
}
