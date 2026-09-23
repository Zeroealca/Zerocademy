import { ClassSessionStatus } from '@prisma/client';
import { ClassSessionResponseDto } from './class-session-response.dto';

describe('ClassSessionResponseDto', () => {
  it('serializes execution calendar dates without leaking timestamps', () => {
    const response = ClassSessionResponseDto.from({
      id: 'session-a',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: null,
      status: ClassSessionStatus.COMPLETED,
      scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
      occurredOn: new Date('2026-06-16T00:00:00.000Z'),
      createdAt: new Date('2026-06-01T10:20:30.000Z'),
      updatedAt: new Date('2026-06-02T10:20:30.000Z'),
    });

    expect(response).toEqual({
      id: 'session-a',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: null,
      status: ClassSessionStatus.COMPLETED,
      scheduledDate: '2026-06-15',
      occurredOn: '2026-06-16',
      createdAt: '2026-06-01T10:20:30.000Z',
      updatedAt: '2026-06-02T10:20:30.000Z',
    });
  });

  it('preserves nullable LessonPlan and calendar-date fields explicitly', () => {
    const response = ClassSessionResponseDto.from({
      id: 'session-a',
      teacherAssignmentId: 'assignment-a',
      lessonPlanId: null,
      status: ClassSessionStatus.SCHEDULED,
      scheduledDate: null,
      occurredOn: null,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-01T00:00:00.000Z'),
    });
    expect(response.lessonPlanId).toBeNull();
    expect(response.scheduledDate).toBeNull();
    expect(response.occurredOn).toBeNull();
  });
});
