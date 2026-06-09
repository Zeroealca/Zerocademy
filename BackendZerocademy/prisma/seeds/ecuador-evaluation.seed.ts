import type { PrismaClient } from '@prisma/client';
import { RoundingStrategy } from '@prisma/client';
import {
  ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES,
  ECUADOR_DEFAULT_GRADE_SCALES,
  ECUADOR_DEFAULT_SCHEME_NAME,
  ECUADOR_EVALUATION_TERM_TEMPLATES,
  ECUADOR_GRADING_SCHEME,
  ECUADOR_EVALUATION_CATALOG_KEY,
} from './ecuador-evaluation.data';
import { seedLog } from './seed-logger';
import { buildRunSummary, emptyCounters, logRunSummary } from './seed-summary';
import type { SeedContext, SeedRunSummary, SeedStepResult } from './types';

const PLATFORM_CONFIG_ID = 'platform-evaluation-defaults';

async function ensureGlobalGradingScheme(ctx: SeedContext) {
  const existing = await ctx.prisma.gradingScheme.findFirst({
    where: {
      institutionId: null,
      name: ECUADOR_DEFAULT_SCHEME_NAME,
      isDefault: true,
    },
  });

  if (existing) {
    await ctx.prisma.gradingScheme.update({
      where: { id: existing.id },
      data: { ...ECUADOR_GRADING_SCHEME, isActive: true },
    });

    for (const scale of ECUADOR_DEFAULT_GRADE_SCALES) {
      await ctx.prisma.gradeScale.upsert({
        where: {
          gradingSchemeId_code: {
            gradingSchemeId: existing.id,
            code: scale.code,
          },
        },
        create: { gradingSchemeId: existing.id, ...scale },
        update: {
          description: scale.description,
          minValue: scale.minValue,
          maxValue: scale.maxValue,
          order: scale.order,
        },
      });
    }

    return existing.id;
  }

  const created = await ctx.prisma.gradingScheme.create({
    data: {
      institutionId: null,
      name: ECUADOR_DEFAULT_SCHEME_NAME,
      ...ECUADOR_GRADING_SCHEME,
      isDefault: true,
      isActive: true,
    },
  });

  await ctx.prisma.gradeScale.createMany({
    data: ECUADOR_DEFAULT_GRADE_SCALES.map((scale) => ({
      gradingSchemeId: created.id,
      ...scale,
    })),
  });

  return created.id;
}

async function runEvaluationStep(ctx: SeedContext): Promise<SeedStepResult> {
  const counters = emptyCounters();

  if (ctx.dryRun) {
    seedLog({
      event: 'ECUADOR_EVALUATION_DRY_RUN',
      message: 'Dry run: would upsert platform Ecuador evaluation defaults',
    });
    counters.inserted += 1;
    return { step: 'ecuador-evaluation', ...counters };
  }

  const schemeId = await ensureGlobalGradingScheme(ctx);
  counters.updated += 1;
  counters.updated += ECUADOR_DEFAULT_GRADE_SCALES.length;

  for (const template of ECUADOR_ASSESSMENT_CATEGORY_TEMPLATES) {
    await ctx.prisma.assessmentCategoryTemplate.upsert({
      where: { name: template.name },
      create: { ...template, isActive: true },
      update: {
        weight: template.weight,
        order: template.order,
        description: template.description,
        isActive: true,
      },
    });
    counters.updated += 1;
  }

  for (const template of ECUADOR_EVALUATION_TERM_TEMPLATES) {
    await ctx.prisma.evaluationTermTemplate.upsert({
      where: { name: template.name },
      create: { ...template, isActive: true },
      update: {
        weight: template.weight,
        order: template.order,
        description: template.description,
        isActive: true,
      },
    });
    counters.updated += 1;
  }

  await ctx.prisma.platformAcademicEvaluationConfig.upsert({
    where: { id: PLATFORM_CONFIG_ID },
    create: {
      id: PLATFORM_CONFIG_ID,
      gradingSchemeId: schemeId,
      roundingStrategy: RoundingStrategy.ROUND_HALF_UP,
      decimalPlaces: ECUADOR_GRADING_SCHEME.decimalPlaces,
    },
    update: {
      gradingSchemeId: schemeId,
      decimalPlaces: ECUADOR_GRADING_SCHEME.decimalPlaces,
    },
  });
  counters.updated += 1;

  seedLog({
    event: 'ECUADOR_EVALUATION_UPSERTED',
    message: 'Platform Ecuador evaluation defaults seeded',
    metadata: { schemeId },
  });

  return { step: 'ecuador-evaluation', ...counters };
}

/**
 * Seeds platform-wide Ecuador evaluation defaults (grading, categories, terms).
 * Idempotent — safe to rerun; updates reference values in place.
 */
export async function seedEcuadorEvaluationDefaults(
  prisma: PrismaClient,
  options?: { dryRun?: boolean },
): Promise<SeedRunSummary> {
  const startedAt = Date.now();
  const ctx: SeedContext = { prisma, dryRun: options?.dryRun };

  seedLog({
    event: 'ECUADOR_EVALUATION_SEED_START',
    message: 'Starting Ecuador platform evaluation defaults seed',
    metadata: { dryRun: Boolean(options?.dryRun) },
  });

  const step = options?.dryRun
    ? await runEvaluationStep(ctx)
    : await prisma.$transaction(async (tx) =>
        runEvaluationStep({ prisma: tx, dryRun: false }),
      );

  const summary = buildRunSummary([step], startedAt);
  logRunSummary(summary);

  return summary;
}

export { ECUADOR_EVALUATION_CATALOG_KEY };
