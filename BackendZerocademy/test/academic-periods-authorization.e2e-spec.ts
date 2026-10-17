/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/only-throw-error -- Supertest response bodies are intentionally untyped at the HTTP boundary and fixture guards fail fast. */
import { INestApplication } from '@nestjs/common';
import {
  AcademicPeriodStatus,
  AcademicRegime,
  PrismaClient,
  Role,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './helpers/create-test-app';

type Account = { email: string; password: string };
type PeriodList = { data: Array<{ id: string; institutionId: string | null }> };

describe('Academic periods HTTP authorization', () => {
  const prisma = new PrismaClient();
  let app: INestApplication<App>;
  let institutionAId: string;
  let institutionBId: string;
  let periodAId: string;
  let periodBId: string;
  let globalPeriodId: string;
  let adminA: Account;
  let adminB: Account;
  let superAdmin: Account;

  const login = async (account: Account): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send(account)
      .expect(201);
    return response.body.accessToken as string;
  };

  const list = (token: string, institutionId?: string) => {
    const query = institutionId ? `&institutionId=${institutionId}` : '';
    return request(app.getHttpServer())
      .get(`/v1/academic-periods?page=1&limit=100${query}`)
      .set('Authorization', `Bearer ${token}`);
  };

  beforeAll(async () => {
    const url = process.env.DATABASE_URL ?? '';
    if (!/zerocademy_e2e/.test(url)) {
      throw new Error(
        'Academic-period E2E requires DATABASE_URL for zerocademy_e2e.',
      );
    }
    const database = await prisma.$queryRaw<Array<{ database: string }>>`
      SELECT current_database() AS database
    `;
    if (database[0]?.database !== 'zerocademy_e2e') {
      throw new Error(
        'Academic-period E2E requires the zerocademy_e2e database.',
      );
    }

    app = await createTestApp();
    const suffix = `period-auth-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const password = 'AcademicPeriodE2e!123';
    const passwordHash = await bcrypt.hash(password, 10);
    const adminProfile = await prisma.permissionProfile.findUniqueOrThrow({
      where: { key: 'ADMIN_BASELINE' },
    });

    const fixture = await prisma.$transaction(async (tx) => {
      const [institutionA, institutionB] = await Promise.all([
        tx.institution.create({
          data: {
            name: `Period A ${suffix}`,
            code: `PERIOD-A-${suffix}`,
            regime: AcademicRegime.COSTA_GALAPAGOS,
          },
        }),
        tx.institution.create({
          data: {
            name: `Period B ${suffix}`,
            code: `PERIOD-B-${suffix}`,
            regime: AcademicRegime.COSTA_GALAPAGOS,
          },
        }),
      ]);
      const [periodA, periodB, globalPeriod] = await Promise.all([
        tx.academicPeriod.create({
          data: {
            name: `Period A ${suffix}`,
            institutionId: institutionA.id,
            regime: AcademicRegime.COSTA_GALAPAGOS,
              startDate: new Date('2091-04-01'),
              endDate: new Date('2092-03-31'),
            status: AcademicPeriodStatus.CLOSED,
          },
        }),
        tx.academicPeriod.create({
          data: {
            name: `Period B ${suffix}`,
            institutionId: institutionB.id,
            regime: AcademicRegime.COSTA_GALAPAGOS,
              startDate: new Date('2092-04-01'),
              endDate: new Date('2093-03-31'),
            status: AcademicPeriodStatus.CLOSED,
          },
        }),
        tx.academicPeriod.create({
          data: {
            name: `Global ${suffix}`,
            regime: AcademicRegime.COSTA_GALAPAGOS,
              startDate: new Date('2093-04-01'),
              endDate: new Date('2094-03-31'),
            status: AcademicPeriodStatus.CLOSED,
          },
        }),
      ]);
      const [a, b, superUser] = await Promise.all([
        tx.user.create({
          data: {
            email: `period-a-${suffix}@example.test`,
            passwordHash,
            firstName: 'Period',
            lastName: 'Admin A',
            role: Role.ADMIN,
          },
        }),
        tx.user.create({
          data: {
            email: `period-b-${suffix}@example.test`,
            passwordHash,
            firstName: 'Period',
            lastName: 'Admin B',
            role: Role.ADMIN,
          },
        }),
        tx.user.create({
          data: {
            email: `period-super-${suffix}@example.test`,
            passwordHash,
            firstName: 'Period',
            lastName: 'Super Admin',
            role: Role.SUPER_ADMIN,
          },
        }),
      ]);
      await tx.institutionMembership.createMany({
        data: [
          {
            institutionId: institutionA.id,
            userId: a.id,
            role: 'ADMIN',
            permissionProfileId: adminProfile.id,
          },
          {
            institutionId: institutionB.id,
            userId: b.id,
            role: 'ADMIN',
            permissionProfileId: adminProfile.id,
          },
        ],
      });
      return {
        institutionA,
        institutionB,
        periodA,
        periodB,
        globalPeriod,
        a,
        b,
        superUser,
      };
    });
    institutionAId = fixture.institutionA.id;
    institutionBId = fixture.institutionB.id;
    periodAId = fixture.periodA.id;
    periodBId = fixture.periodB.id;
    globalPeriodId = fixture.globalPeriod.id;
    adminA = { email: fixture.a.email, password };
    adminB = { email: fixture.b.email, password };
    superAdmin = { email: fixture.superUser.email, password };
  });

  afterAll(async () => {
    await prisma.institution.deleteMany({
      where: { id: { in: [institutionAId, institutionBId] } },
    });
    await prisma.academicPeriod.deleteMany({ where: { id: globalPeriodId } });
    await prisma.user.deleteMany({
      where: { email: { in: [adminA.email, adminB.email, superAdmin.email] } },
    });
    await app?.close();
    await prisma.$disconnect();
  });

  it('returns only an ADMIN institution periods plus global periods, with no-filter isolation', async () => {
    const token = await login(adminA);
    const response = await list(token).expect(200);
    const ids = (response.body as PeriodList).data.map((period) => period.id);
    expect(ids).toContain(periodAId);
    expect(ids).toContain(globalPeriodId);
    expect(ids).not.toContain(periodBId);
  });

  it('does not expose a foreign ADMIN institution through an explicit filter', async () => {
    const token = await login(adminA);
    const response = await list(token, institutionBId).expect(200);
    expect((response.body as PeriodList).data).toEqual([]);
  });

  it('scopes each ADMIN independently and preserves SUPER_ADMIN platform access', async () => {
    const [adminToken, superToken] = await Promise.all([
      login(adminB),
      login(superAdmin),
    ]);
    const own = await list(adminToken, institutionBId).expect(200);
    expect((own.body as PeriodList).data.map((period) => period.id)).toEqual(
      expect.arrayContaining([periodBId, globalPeriodId]),
    );
    expect(
      (own.body as PeriodList).data.map((period) => period.id),
    ).not.toContain(periodAId);
    const platform = await list(superToken, institutionAId).expect(200);
    expect(
      (platform.body as PeriodList).data.map((period) => period.id),
    ).toEqual(expect.arrayContaining([periodAId, globalPeriodId]));
  });

  it('rejects anonymous and malformed institution requests', async () => {
    await request(app.getHttpServer())
      .get('/v1/academic-periods?page=1&limit=100')
      .expect(401);
    const token = await login(adminA);
    await list(token, 'not-a-uuid').expect(400);
  });
});
