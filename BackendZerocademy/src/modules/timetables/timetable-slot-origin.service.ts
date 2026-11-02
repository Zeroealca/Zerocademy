import { Injectable, NotFoundException } from '@nestjs/common';
import { TimetableStatus, Weekday } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type PublishedTimetableSlotOrigin = {
  id: string;
  teacherAssignmentId: string;
  weekday: Weekday;
  institutionId: string;
  institutionName: string;
  academicPeriodId: string;
  academicPeriodName: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  scheduleBlockId: string;
  startTime: Date;
  endTime: Date;
};

/**
 * Narrow cross-domain read facade. Timetables owns the definition of a slot
 * that is currently publishable as an execution origin; Academic Execution
 * remains the owner of ClassSession writes.
 */
@Injectable()
export class TimetableSlotOriginService {
  constructor(private readonly prisma: PrismaService) {}

  async resolvePublishedForAssignment(
    timetableSlotId: string,
    teacherAssignmentId: string,
  ): Promise<PublishedTimetableSlotOrigin> {
    const slot = await this.prisma.timetableSlot.findFirst({
      where: {
        id: timetableSlotId,
        teacherAssignmentId,
        timetable: { status: TimetableStatus.PUBLISHED },
      },
      select: {
        id: true,
        teacherAssignmentId: true,
        dayOfWeek: true,
        courseId: true,
        scheduleBlockId: true,
        scheduleBlock: { select: { startTime: true, endTime: true } },
        timetable: {
          select: {
            institutionId: true,
            academicPeriodId: true,
            institution: { select: { name: true } },
            academicPeriod: { select: { name: true } },
          },
        },
        teacherAssignment: {
          select: {
            subjectId: true,
            subject: { select: { name: true } },
            course: { select: { name: true } },
          },
        },
      },
    });
    if (!slot)
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- Nest HTTP exceptions are the API error contract.
      throw new NotFoundException('Published timetable slot not found');

    return {
      id: slot.id,
      teacherAssignmentId: slot.teacherAssignmentId,
      weekday: slot.dayOfWeek,
      institutionId: slot.timetable.institutionId,
      institutionName: slot.timetable.institution.name,
      academicPeriodId: slot.timetable.academicPeriodId,
      academicPeriodName: slot.timetable.academicPeriod.name,
      courseId: slot.courseId,
      courseName: slot.teacherAssignment.course.name,
      subjectId: slot.teacherAssignment.subjectId,
      subjectName: slot.teacherAssignment.subject.name,
      scheduleBlockId: slot.scheduleBlockId,
      startTime: slot.scheduleBlock.startTime,
      endTime: slot.scheduleBlock.endTime,
    };
  }
}
