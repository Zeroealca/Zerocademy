import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  DEMO_GRADES_ASSESSMENT_TITLE,
  DEMO_GRADES_CREDENTIALS,
  DEMO_GRADES_INSTITUTION_CODE,
} from '../prisma/seeds/grades-demo.data';
import { seedGradesDemo } from '../prisma/seeds/grades-demo.seed';
import { createTestApp } from './helpers/create-test-app';

describe('Grades module (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await seedGradesDemo(prisma);
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  async function login(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email, password })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    return response.body.accessToken as string;
  }

  it('teacher lists assessments for demo institution', async () => {
    const token = await login(
      DEMO_GRADES_CREDENTIALS.teacher.email,
      DEMO_GRADES_CREDENTIALS.teacher.password,
    );

    const institution = await prisma.institution.findUniqueOrThrow({
      where: { code: DEMO_GRADES_INSTITUTION_CODE },
    });

    const response = await request(app.getHttpServer())
      .get('/v1/assessments')
      .query({ institutionId: institution.id, limit: 20, page: 1 })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.some(
        (item: { title: string }) => item.title === DEMO_GRADES_ASSESSMENT_TITLE,
      ),
    ).toBe(true);
  });

  it('teacher creates assessment, bulk upserts grades, student reads own grade', async () => {
    const teacherToken = await login(
      DEMO_GRADES_CREDENTIALS.teacher.email,
      DEMO_GRADES_CREDENTIALS.teacher.password,
    );

    const institution = await prisma.institution.findUniqueOrThrow({
      where: { code: DEMO_GRADES_INSTITUTION_CODE },
    });

    const assignment = await prisma.teacherAssignment.findFirstOrThrow({
      where: { institutionId: institution.id },
      include: {
        academicPeriod: { include: { terms: { orderBy: { order: 'asc' } } } },
      },
    });

    const category = await prisma.assessmentCategory.findFirstOrThrow({
      where: { institutionId: institution.id, isActive: true },
    });

    const createResponse = await request(app.getHttpServer())
      .post('/v1/assessments')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        institutionId: institution.id,
        academicPeriodId: assignment.academicPeriodId,
        academicTermId: assignment.academicPeriod.terms[0].id,
        subjectId: assignment.subjectId,
        teacherAssignmentId: assignment.id,
        assessmentCategoryId: category.id,
        title: 'E2E Quiz Mathematics',
        maxScore: 10,
        weight: 15,
        assessmentDate: '2025-11-01',
      })
      .expect(201);

    const assessmentId = createResponse.body.id as string;

    const entrySheet = await request(app.getHttpServer())
      .get(`/v1/grades/entry-sheet/${assessmentId}`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);

    expect(entrySheet.body.rows.length).toBeGreaterThanOrEqual(2);

    const bulkResponse = await request(app.getHttpServer())
      .post('/v1/grades/bulk')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        assessmentId,
        grades: entrySheet.body.rows.map(
          (row: { enrollmentId: string }, index: number) => ({
            enrollmentId: row.enrollmentId,
            score: index === 0 ? 9.25 : 6.5,
            observations: 'E2E bulk grade',
          }),
        ),
      })
      .expect(201);

    expect(bulkResponse.body.createdCount + bulkResponse.body.updatedCount).toBe(
      2,
    );

    const studentToken = await login(
      DEMO_GRADES_CREDENTIALS.students[0].email,
      DEMO_GRADES_CREDENTIALS.students[0].password,
    );

    const gradesResponse = await request(app.getHttpServer())
      .get('/v1/grades')
      .query({ assessmentId, limit: 20, page: 1 })
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(gradesResponse.body.data).toHaveLength(1);
    expect(gradesResponse.body.data[0].score).toBe(9.25);
  });

  it('admin can read assessments but cannot create them', async () => {
    const adminToken = await login(
      DEMO_GRADES_CREDENTIALS.admin.email,
      DEMO_GRADES_CREDENTIALS.admin.password,
    );

    await request(app.getHttpServer())
      .get('/v1/assessments')
      .query({ limit: 10, page: 1 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const institution = await prisma.institution.findUniqueOrThrow({
      where: { code: DEMO_GRADES_INSTITUTION_CODE },
    });

    const assignment = await prisma.teacherAssignment.findFirstOrThrow({
      where: { institutionId: institution.id },
      include: {
        academicPeriod: { include: { terms: { orderBy: { order: 'asc' } } } },
      },
    });

    const category = await prisma.assessmentCategory.findFirstOrThrow({
      where: { institutionId: institution.id, isActive: true },
    });

    await request(app.getHttpServer())
      .post('/v1/assessments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        institutionId: institution.id,
        academicPeriodId: assignment.academicPeriodId,
        academicTermId: assignment.academicPeriod.terms[0].id,
        subjectId: assignment.subjectId,
        teacherAssignmentId: assignment.id,
        assessmentCategoryId: category.id,
        title: 'Admin should not create',
        maxScore: 10,
        weight: 10,
        assessmentDate: '2025-11-01',
      })
      .expect(403);
  });
});
