import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ClassSession, ClassSessionStatus, Role } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { ClassSessionsController } from './class-sessions.controller';
import { ClassSessionsFoundationService } from './class-sessions-foundation.service';
import {
  CreateClassSessionDto,
  UpdateClassSessionDto,
} from './dto/class-session.dto';

const actor: AuthenticatedUser = {
  id: 'teacher-user-a',
  email: 'teacher-a@example.test',
  firstName: 'Ada',
  lastName: 'Teacher',
  role: Role.TEACHER,
  profileId: 'teacher-profile-a',
  institutionId: 'institution-a',
};

const session = {
  id: 'session-a',
  teacherAssignmentId: 'assignment-a',
  lessonPlanId: null,
  status: ClassSessionStatus.SCHEDULED,
  scheduledDate: new Date('2026-06-15T00:00:00.000Z'),
  occurredOn: null,
  createdAt: new Date('2026-06-01T10:20:30.000Z'),
  updatedAt: new Date('2026-06-02T10:20:30.000Z'),
} as unknown as ClassSession;

describe('ClassSessionsController contract', () => {
  let app: INestApplication;
  let controller: ClassSessionsController;
  const sessions = {
    list: jest.fn(),
    one: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    sessions.list.mockResolvedValue([session]);
    sessions.one.mockResolvedValue(session);
    sessions.create.mockResolvedValue(session);
    sessions.update.mockResolvedValue(session);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassSessionsController],
      providers: [
        {
          provide: ClassSessionsFoundationService,
          useValue: sessions,
        },
      ],
    }).compile();

    controller = module.get<ClassSessionsController>(ClassSessionsController);
    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('forwards the actor and teacher assignment route ID for GET list and maps responses', async () => {
    await expect(controller.list(actor, 'assignment-a')).resolves.toEqual([
      expect.objectContaining({
        id: 'session-a',
        scheduledDate: '2026-06-15',
      }),
    ]);
    expect(sessions.list).toHaveBeenCalledWith(actor, 'assignment-a');
  });

  it('forwards the actor and nested route IDs for GET detail and maps the response', async () => {
    await expect(
      controller.one(actor, 'assignment-a', 'session-a'),
    ).resolves.toEqual(
      expect.objectContaining({ id: 'session-a', occurredOn: null }),
    );
    expect(sessions.one).toHaveBeenCalledWith(
      actor,
      'assignment-a',
      'session-a',
    );
  });

  it('forwards the POST DTO with the teacher assignment ID supplied by the route', async () => {
    const dto: CreateClassSessionDto = { scheduledDate: '2026-06-15' };

    await expect(
      controller.create(actor, 'assignment-a', dto),
    ).resolves.toEqual(expect.objectContaining({ id: 'session-a' }));
    expect(sessions.create).toHaveBeenCalledWith(actor, {
      ...dto,
      teacherAssignmentId: 'assignment-a',
    });
  });

  it('forwards the PATCH DTO with actor and nested route IDs', async () => {
    const dto: UpdateClassSessionDto = { lessonPlanId: null };

    await expect(
      controller.update(actor, 'assignment-a', 'session-a', dto),
    ).resolves.toEqual(expect.objectContaining({ id: 'session-a' }));
    expect(sessions.update).toHaveBeenCalledWith(
      actor,
      'assignment-a',
      'session-a',
      dto,
    );
  });

  /* eslint-disable @typescript-eslint/no-unsafe-assignment -- Swagger's matcher metadata is untyped. */
  it('documents the supported nested routes, DTOs, responses, errors, and field contracts', () => {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().addBearerAuth().build(),
    );
    const collection =
      document.paths[
        '/v1/teacher-assignments/{teacherAssignmentId}/class-sessions'
      ];
    const detail =
      document.paths[
        '/v1/teacher-assignments/{teacherAssignmentId}/class-sessions/{classSessionId}'
      ];

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
      post: {
        responses: {
          '201': expect.any(Object),
          '400': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
          '404': expect.any(Object),
          '409': expect.any(Object),
        },
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateClassSessionDto' },
            },
          },
        },
      },
    });
    expect(detail).toMatchObject({
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
      patch: {
        responses: {
          '200': expect.any(Object),
          '400': expect.any(Object),
          '401': expect.any(Object),
          '403': expect.any(Object),
          '404': expect.any(Object),
          '409': expect.any(Object),
        },
        requestBody: {
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateClassSessionDto' },
            },
          },
        },
      },
    });
    expect(collection?.delete).toBeUndefined();
    expect(detail?.delete).toBeUndefined();
    expect(JSON.stringify(document.paths)).not.toContain('"in":"query"');

    expect(document.components?.schemas?.ClassSessionResponseDto).toMatchObject(
      {
        properties: {
          id: { format: 'uuid' },
          teacherAssignmentId: { format: 'uuid' },
          lessonPlanId: { format: 'uuid', nullable: true },
          status: {
            enum: [
              ClassSessionStatus.SCHEDULED,
              ClassSessionStatus.COMPLETED,
              ClassSessionStatus.CANCELLED,
            ],
          },
          scheduledDate: { format: 'date', nullable: true },
          occurredOn: { format: 'date', nullable: true },
          createdAt: { format: 'date-time' },
          updatedAt: { format: 'date-time' },
        },
      },
    );
    expect(document.components?.schemas?.CreateClassSessionDto).toMatchObject({
      properties: {
        lessonPlanId: { format: 'uuid', nullable: true },
        status: { enum: expect.any(Array) },
        scheduledDate: { format: 'date', nullable: true },
        occurredOn: { format: 'date', nullable: true },
      },
    });
    expect(document.components?.schemas?.UpdateClassSessionDto).toMatchObject({
      properties: {
        lessonPlanId: { format: 'uuid', nullable: true },
      },
    });
    expect(
      document.components?.schemas?.CreateClassSessionDto,
    ).not.toMatchObject({
      properties: expect.objectContaining({
        teacherAssignmentId: expect.anything(),
        classSessionId: expect.anything(),
      }),
    });
  });
  /* eslint-enable @typescript-eslint/no-unsafe-assignment */
});
