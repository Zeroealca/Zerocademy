import type { PrismaClient } from '@prisma/client';
import { seedAcademicLevels } from '../academic-levels.seed';
import { seedGradeLevels } from '../grade-levels.seed';
import { seedSubjectAssignments } from '../subject-assignments.seed';
import { seedSubjects } from '../subjects.seed';
import { buildRunSummary, logRunSummary } from '../seed-summary';
import { seedLog } from '../seed-logger';
import type { SeedContext, SeedRunSummary } from '../types';
import {
  ECUADOR_CATALOG_KEY,
  ecuadorAcademicLevels,
  ecuadorAllGradeCodes,
  ecuadorGradesByLevelCode,
  ecuadorSubjectAssignments,
  ecuadorSubjects,
} from './ecuador.data';

export interface EcuadorCurriculumSeedOptions {
  dryRun?: boolean;
}

async function runEcuadorSteps(ctx: SeedContext): Promise<
  Awaited<ReturnType<typeof seedAcademicLevels>>[]
> {
  const catalogKey = ECUADOR_CATALOG_KEY;
  const expectedLevelCodes = new Set(
    ecuadorAcademicLevels.map((level) => level.code),
  );
  const expectedSubjectCodes = new Set(
    ecuadorSubjects.map((subject) => subject.code),
  );
  const expectedGradeCodes = new Set(ecuadorAllGradeCodes);

  const levelStep = await seedAcademicLevels(ctx, ecuadorAcademicLevels, {
    catalogKey,
  });
  const gradeStep = await seedGradeLevels(ctx, ecuadorGradesByLevelCode, {
    catalogKey,
    expectedLevelCodes: ctx.dryRun ? expectedLevelCodes : undefined,
  });
  const subjectStep = await seedSubjects(ctx, ecuadorSubjects, { catalogKey });
  const assignmentStep = await seedSubjectAssignments(
    ctx,
    ecuadorSubjectAssignments,
    {
      catalogKey,
      expectedSubjectCodes: ctx.dryRun ? expectedSubjectCodes : undefined,
      expectedGradeCodes: ctx.dryRun ? expectedGradeCodes : undefined,
    },
  );

  return [levelStep, gradeStep, subjectStep, assignmentStep];
}

/**
 * Seeds the Ecuador national reference catalog (levels, grades, subjects, links).
 * Idempotent — safe to rerun; updates names/order on existing system rows.
 */
export async function seedEcuadorCurriculum(
  prisma: PrismaClient,
  options?: EcuadorCurriculumSeedOptions,
): Promise<SeedRunSummary> {
  const startedAt = Date.now();
  const ctx: SeedContext = { prisma, dryRun: options?.dryRun };
  const catalogKey = ECUADOR_CATALOG_KEY;

  seedLog({
    event: 'ECUADOR_CURRICULUM_SEED_START',
    message: 'Starting Ecuador curriculum catalog seed',
    metadata: { catalogKey, dryRun: Boolean(options?.dryRun) },
  });

  const steps = options?.dryRun
    ? await runEcuadorSteps(ctx)
    : await prisma.$transaction(async (tx) =>
        runEcuadorSteps({ prisma: tx, dryRun: false }),
      );

  const summary = buildRunSummary(steps, startedAt);
  logRunSummary(summary);

  seedLog({
    event: 'ECUADOR_CURRICULUM_SEED_COMPLETE',
    message: 'Ecuador curriculum catalog seed finished',
    metadata: {
      catalogKey,
      inserted: summary.totals.inserted,
      updated: summary.totals.updated,
      skipped: summary.totals.skipped,
      durationMs: summary.durationMs,
    },
  });

  return summary;
}
