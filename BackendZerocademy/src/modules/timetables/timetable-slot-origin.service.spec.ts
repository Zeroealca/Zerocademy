import { NotFoundException } from '@nestjs/common';
import { TimetableStatus, Weekday } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TimetableSlotOriginService } from './timetable-slot-origin.service';

describe('TimetableSlotOriginService', () => {
  const prisma = { timetableSlot: { findFirst: jest.fn() } };
  const service = new TimetableSlotOriginService(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('resolves a slot only when it is published and belongs to the requested assignment', async () => {
    prisma.timetableSlot.findFirst.mockResolvedValue({
      id: 'slot-a',
      teacherAssignmentId: 'assignment-a',
      dayOfWeek: Weekday.MON,
      courseId: 'course-a',
      scheduleBlockId: 'block-a',
      scheduleBlock: {
        startTime: new Date('1970-01-01T08:00:00Z'),
        endTime: new Date('1970-01-01T09:00:00Z'),
      },
      timetable: {
        institutionId: 'institution-a',
        institution: { name: 'Institution A' },
        academicPeriodId: 'period-a',
        academicPeriod: { name: '2026-2027' },
      },
      teacherAssignment: {
        subjectId: 'subject-a',
        course: { name: 'Course A' },
        subject: { name: 'Subject A' },
      },
    });

    await expect(
      service.resolvePublishedForAssignment('slot-a', 'assignment-a'),
    ).resolves.toMatchObject({
      id: 'slot-a',
      institutionId: 'institution-a',
      institutionName: 'Institution A',
      academicPeriodId: 'period-a',
      academicPeriodName: '2026-2027',
      subjectId: 'subject-a',
      subjectName: 'Subject A',
      courseName: 'Course A',
    });
    expect(prisma.timetableSlot.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'slot-a',
          teacherAssignmentId: 'assignment-a',
          timetable: { status: TimetableStatus.PUBLISHED },
        },
      }),
    );
  });

  it('hides draft, foreign, or deleted slots', async () => {
    prisma.timetableSlot.findFirst.mockResolvedValue(null);
    await expect(
      service.resolvePublishedForAssignment('slot-a', 'assignment-a'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
