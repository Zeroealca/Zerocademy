import { seedLog } from './seed-logger';
import type { SeedCounters, SeedRunSummary, SeedStepResult } from './types';

export function emptyCounters(): SeedCounters {
  return { inserted: 0, updated: 0, skipped: 0 };
}

export function mergeCounters(
  target: SeedCounters,
  source: SeedCounters,
): void {
  target.inserted += source.inserted;
  target.updated += source.updated;
  target.skipped += source.skipped;
}

export function buildRunSummary(
  steps: SeedStepResult[],
  startedAt: number,
): SeedRunSummary {
  const totals = emptyCounters();

  for (const step of steps) {
    mergeCounters(totals, step);
  }

  return {
    steps,
    totals,
    durationMs: Date.now() - startedAt,
  };
}

export function logRunSummary(summary: SeedRunSummary): void {
  seedLog({
    event: 'SEED_RUN_SUMMARY',
    message: 'Seed execution completed',
    metadata: {
      durationMs: summary.durationMs,
      inserted: summary.totals.inserted,
      updated: summary.totals.updated,
      skipped: summary.totals.skipped,
      steps: summary.steps.map(
        (step) =>
          `${step.step}:+${step.inserted}/~${step.updated}/=${step.skipped}`,
      ),
    },
  });
}
