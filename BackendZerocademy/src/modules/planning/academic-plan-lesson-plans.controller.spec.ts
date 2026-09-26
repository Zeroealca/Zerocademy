import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { AcademicPlanLessonPlansController } from './academic-plan-lesson-plans.controller';
import { LessonPlansService } from './lesson-plans.service';

const actor: AuthenticatedUser = {
  id: 'teacher-user',
  email: 'teacher@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile',
  institutionId: 'institution-a',
};

const lesson = {
  id: 'lesson-a',
  academicUnitId: 'unit-a',
  title: 'Introducción a fracciones',
  lessonDate: new Date('2026-09-01T00:00:00.000Z'),
  durationMinutes: 45,
  objectives: null,
  introduction: null,
  development: null,
  closure: null,
  resources: null,
  evaluationStrategy: null,
  notes: null,
  position: 1,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
  updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  academicUnit: { title: 'Números racionales' },
};

describe('AcademicPlanLessonPlansController contract', () => {
  let app: INestApplication;
  let controller: AcademicPlanLessonPlansController;
  const lessons = { listForAcademicPlan: jest.fn() };

  beforeEach(async () => {
    lessons.listForAcademicPlan.mockResolvedValue([lesson]);
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicPlanLessonPlansController],
      providers: [{ provide: LessonPlansService, useValue: lessons }],
    }).compile();
    controller = module.get(AcademicPlanLessonPlansController);
    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterEach(async () => app.close());

  it('forwards the actor and plan route ID and maps selector metadata', async () => {
    await expect(controller.list(actor, 'plan-a')).resolves.toEqual([
      expect.objectContaining({
        id: 'lesson-a',
        academicUnitId: 'unit-a',
        academicUnitTitle: 'Números racionales',
        lessonDate: '2026-09-01',
      }),
    ]);
    expect(lessons.listForAcademicPlan).toHaveBeenCalledWith(actor, 'plan-a');
  });

  it('documents the aggregate read route and its selector metadata', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const collection =
      document.paths['/v1/academic-plans/{planId}/lesson-plans'];

    expect(collection).toMatchObject({
      get: {
        responses: {
          '200': expect.any(Object),
          '400': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
          '404': expect.any(Object),
          '409': expect.any(Object),
        },
      },
    });
    expect(collection?.post).toBeUndefined();
    expect(collection?.patch).toBeUndefined();
    expect(collection?.delete).toBeUndefined();
    expect(
      document.components?.schemas?.AcademicPlanLessonPlanResponseDto,
    ).toMatchObject({
      properties: {
        id: { format: 'uuid' },
        academicUnitId: { format: 'uuid' },
        academicUnitTitle: { type: 'string' },
      },
    });
  });
});
