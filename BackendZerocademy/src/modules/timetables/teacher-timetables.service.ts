import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, TimetableStatus, Weekday } from '@prisma/client';
import { MembershipPermissionEnforcer } from '../../common/rbac/membership-permission-enforcer.service';
import { PERMISSIONS } from '../../common/rbac/permission-catalog';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import type {
  TeacherTimetableListResponseDto,
  TeacherTimetableResponseDto,
} from './dto/teacher-timetable.dto';
import { TeacherTimetableClock } from './teacher-timetable-clock.service';

const teacherTimetableInclude = Prisma.validator<Prisma.TimetableInclude>()({
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
        },
      },
    },
  },
});

type TeacherTimetable = Prisma.TimetableGetPayload<{
  include: typeof teacherTimetableInclude;
}>;

@Injectable()
export class TeacherTimetablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly permissions: MembershipPermissionEnforcer,
    private readonly clock: TeacherTimetableClock,
  ) {}

  async weekly(
    actor: AuthenticatedUser,
    academicPeriodId?: string,
  ): Promise<TeacherTimetableListResponseDto> {
    const teacherId = this.requireTeacherProfile(actor);
    const timetables = await this.findPublished(actor, academicPeriodId);
    return {
      data: timetables.map((timetable) =>
        this.toResponse(timetable, teacherId),
      ),
    };
  }

  async today(
    actor: AuthenticatedUser,
    academicPeriodId?: string,
    now = this.clock.now(),
  ): Promise<TeacherTimetableListResponseDto> {
    const teacherId = this.requireTeacherProfile(actor);
    const weekday = this.weekdayFor(now);
    const timetables = await this.findPublished(actor, academicPeriodId);
    return {
      data: timetables.map((timetable) =>
        this.toResponse(timetable, teacherId, weekday ?? null),
      ),
    };
  }

  private async findPublished(
    actor: AuthenticatedUser,
    academicPeriodId?: string,
  ): Promise<TeacherTimetable[]> {
    this.requireTeacherProfile(actor);
    const timetables = await this.prisma.timetable.findMany({
      where: {
        status: TimetableStatus.PUBLISHED,
        ...(academicPeriodId ? { academicPeriodId } : {}),
        slots: { some: { teacherId: actor.profileId } },
      },
      include: teacherTimetableInclude,
      orderBy: { academicPeriod: { startDate: 'desc' } },
    });
    await Promise.all(
      timetables.map((timetable) =>
        this.permissions.requireForInstitutionMembership({
          actor,
          institutionId: timetable.institutionId,
          permission: PERMISSIONS.TIMETABLES.READ,
          domain: 'timetables',
          resourceType: 'teacherTimetable',
          resourceId: timetable.id,
        }),
      ),
    );
    return timetables;
  }

  private requireTeacherProfile(actor: AuthenticatedUser): string {
    if (actor.role !== Role.TEACHER || !actor.profileId) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions carry the intended API response.
      throw new NotFoundException('Teacher timetable not found');
    }
    return actor.profileId;
  }

  private toResponse(
    timetable: TeacherTimetable,
    teacherId: string,
    weekday?: Weekday | null,
  ): TeacherTimetableResponseDto {
    return {
      id: timetable.id,
      institutionId: timetable.institutionId,
      academicPeriodId: timetable.academicPeriodId,
      academicPeriodName: timetable.academicPeriod.name,
      slots: timetable.slots
        .filter(
          (slot) =>
            slot.teacherId === teacherId &&
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
        })),
    };
  }

  private weekdayFor(now: Date): Weekday | undefined {
    const weekday = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: 'America/Guayaquil',
    }).format(now);
    const weekdays: Record<string, Weekday> = {
      Mon: Weekday.MON,
      Tue: Weekday.TUE,
      Wed: Weekday.WED,
      Thu: Weekday.THU,
      Fri: Weekday.FRI,
    };
    return weekdays[weekday];
  }

  private time(value: Date): string {
    return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
  }
}
