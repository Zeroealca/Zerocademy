import { NotFoundException } from '@nestjs/common';
import {
  EnrollmentStatus,
  Role,
  TimetableStatus,
  Weekday,
} from '@prisma/client';
import { StudentTimetablesService } from './student-timetables.service';

const student = {
  id: 'student-user',
  email: 'student@example.test',
  firstName: 'Sara',
  lastName: 'Estudiante',
  role: Role.STUDENT,
  profileId: 'student-a',
};
const representative = {
  id: 'representative-user',
  email: 'rep@example.test',
  firstName: 'Rosa',
  lastName: 'Representante',
  role: Role.REPRESENTATIVE,
  profileId: 'representative-a',
};
const timetable = {
  id: 'timetable-a',
  institutionId: 'institution-a',
  academicPeriodId: 'period-a',
  academicPeriod: { name: '2026-2027' },
  slots: [
    {
      id: 'slot-a',
      teacherAssignmentId: 'assignment-a',
      scheduleBlockId: 'block-a',
      dayOfWeek: Weekday.MON,
      courseId: 'course-a',
      scheduleBlock: {
        id: 'block-a',
        position: 1,
        startTime: new Date('1970-01-01T08:00:00Z'),
        endTime: new Date('1970-01-01T08:40:00Z'),
      },
      teacherAssignment: {
        course: { id: 'course-a', name: '10.º A' },
        subject: { name: 'Matemática' },
        teacher: { user: { firstName: 'Ana', lastName: 'Docente' } },
      },
    },
  ],
};

describe('StudentTimetablesService', () => {
  const prisma = {
    enrollment: { findMany: jest.fn() },
    timetable: { findMany: jest.fn() },
    representativeStudent: { findFirst: jest.fn() },
  };
  const clock = { now: jest.fn(() => new Date('2026-10-19T12:00:00-05:00')) };
  const service = new StudentTimetablesService(prisma as never, clock);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.enrollment.findMany.mockResolvedValue([
      {
        courseId: 'course-a',
        academicPeriodId: 'period-a',
        course: { institutionId: 'institution-a' },
      },
    ]);
    prisma.timetable.findMany.mockResolvedValue([timetable]);
    prisma.representativeStudent.findFirst.mockResolvedValue({
      id: 'relationship-a',
    });
  });

  it('returns only published slots for the authenticated student enrollment and requested period', async () => {
    await expect(
      service.studentWeekly(student, 'period-a'),
    ).resolves.toMatchObject({
      data: [{ slots: [{ id: 'slot-a', teacherName: 'Ana Docente' }] }],
    });
    expect(prisma.enrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matcher accepts an untyped partial Prisma query.
        where: expect.objectContaining({
          studentId: 'student-a',
          academicPeriodId: 'period-a',
          status: EnrollmentStatus.ACTIVE,
        }),
      }),
    );
    expect(prisma.timetable.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Jest asymmetric matcher accepts an untyped partial Prisma query.
        where: expect.objectContaining({ status: TimetableStatus.PUBLISHED }),
      }),
    );
  });

  it('does not expose timetable data when the student has no active enrollment', async () => {
    prisma.enrollment.findMany.mockResolvedValue([]);
    await expect(service.studentWeekly(student)).resolves.toEqual({ data: [] });
    expect(prisma.timetable.findMany).not.toHaveBeenCalled();
  });

  it('requires an active authenticated representative relationship on every request', async () => {
    await service.representativeWeekly(representative, 'student-a', 'period-a');
    expect(prisma.representativeStudent.findFirst).toHaveBeenCalledWith({
      where: {
        representativeUserId: 'representative-user',
        studentId: 'student-a',
        isActive: true,
      },
      select: { id: true },
    });
    prisma.representativeStudent.findFirst.mockResolvedValue(null);
    await expect(
      service.representativeWeekly(representative, 'student-b'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('uses the injected Ecuador clock for Today and returns an empty non-instructional day', async () => {
    await expect(
      service.studentToday(
        student,
        'period-a',
        new Date('2026-10-18T12:00:00-05:00'),
      ),
    ).resolves.toEqual({ data: [] });
  });
});
