import { PrismaClient, ScheduleBlockKind, Weekday } from '@prisma/client';
import {
  assertIsolatedE2eDatabase,
  createScheduleStructureE2eFixture,
} from './helpers/schedule-structure-e2e-fixture';

describe('schedule-structure reusable E2E fixture', () => {
  const prisma = new PrismaClient();

  beforeAll(async () => {
    await assertIsolatedE2eDatabase(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it.each([1, 2])(
    'creates, reads, and cleans up isolated fixture run %i',
    async () => {
      const fixture = await createScheduleStructureE2eFixture(prisma);

      try {
        const structure =
          await prisma.periodScheduleStructure.findUniqueOrThrow({
            where: { id: fixture.scheduleStructureId },
            include: { scheduleBlocks: { orderBy: { position: 'asc' } } },
          });
        expect(structure.institutionId).toBe(fixture.institutionId);
        expect(structure.academicPeriodId).toBe(fixture.academicPeriodId);
        expect(structure.enabledWeekdays).toEqual([
          Weekday.MON,
          Weekday.TUE,
          Weekday.WED,
        ]);
        expect(structure.scheduleBlocks).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'P1',
              kind: ScheduleBlockKind.TEACHING,
            }),
            expect.objectContaining({
              name: 'Break',
              kind: ScheduleBlockKind.BREAK,
            }),
            expect.objectContaining({
              name: 'P2',
              kind: ScheduleBlockKind.TEACHING,
            }),
          ]),
        );
      } finally {
        await fixture.cleanup();
      }

      await expect(
        prisma.periodScheduleStructure.findUnique({
          where: { id: fixture.scheduleStructureId },
        }),
      ).resolves.toBeNull();
      await expect(
        prisma.user.findUnique({ where: { id: fixture.userId } }),
      ).resolves.toBeNull();
    },
  );
});
