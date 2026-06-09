import type { PrismaClient } from '@prisma/client';
import { seedEcuadorCurriculum } from './curriculum/ecuador-curriculum.seed';
import { seedEcuadorEvaluationDefaults } from './ecuador-evaluation.seed';
import { seedLog } from './seed-logger';
import type { SeedRunSummary } from './types';

export { seedAcademicLevels } from './academic-levels.seed';
export { seedGradeLevels } from './grade-levels.seed';
export { seedSubjects } from './subjects.seed';
export { seedSubjectAssignments } from './subject-assignments.seed';
export { seedEcuadorCurriculum } from './curriculum/ecuador-curriculum.seed';
export { seedEcuadorEvaluationDefaults } from './ecuador-evaluation.seed';
export { seedGradesDemo, DEMO_GRADES_CREDENTIALS } from './grades-demo.seed';
export type { EcuadorCurriculumSeedOptions } from './curriculum/ecuador-curriculum.seed';

export interface RunCatalogSeedsOptions {
  /** Comma-separated catalog keys, e.g. `ecuador`. Default: `ecuador`. */
  catalogs?: string;
  dryRun?: boolean;
}

/**
 * Runs enabled country/region curriculum catalog seeds.
 */
export async function runCatalogSeeds(
  prisma: PrismaClient,
  options?: RunCatalogSeedsOptions,
): Promise<SeedRunSummary[]> {
  const catalogs = (options?.catalogs ?? process.env.SEED_CATALOGS ?? 'ecuador')
    .split(',')
    .map((key) => key.trim().toLowerCase())
    .filter(Boolean);

  const summaries: SeedRunSummary[] = [];

  for (const catalog of catalogs) {
    if (catalog === 'ecuador') {
      summaries.push(
        await seedEcuadorCurriculum(prisma, { dryRun: options?.dryRun }),
      );
      summaries.push(
        await seedEcuadorEvaluationDefaults(prisma, {
          dryRun: options?.dryRun,
        }),
      );
      continue;
    }

    seedLog({
      event: 'CATALOG_SEED_SKIPPED',
      message: 'Unknown catalog key — skipping',
      metadata: { catalog },
    });
  }

  return summaries;
}
