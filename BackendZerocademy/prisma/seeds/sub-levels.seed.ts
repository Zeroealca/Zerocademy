import type { SeedContext, SeedStepResult, SubLevelSeedRow } from './types';
import { emptyCounters } from './seed-summary';
import { seedLog, seedWarn } from './seed-logger';

export async function seedSubLevels(
  ctx: SeedContext,
  subLevelsByAcademicLevelCode: Record<string, SubLevelSeedRow[]>,
  options?: { catalogKey?: string; expectedAcademicLevelCodes?: Set<string> },
): Promise<SeedStepResult> {
  const counters = emptyCounters();
  const catalogKey = options?.catalogKey ?? 'default';

  for (const [academicLevelCode, subLevels] of Object.entries(
    subLevelsByAcademicLevelCode,
  )) {
    const academicLevel = await ctx.prisma.academicLevel.findFirst({
      where: { code: academicLevelCode, institutionId: null },
    });

    if (!academicLevel) {
      if (
        ctx.dryRun &&
        options?.expectedAcademicLevelCodes?.has(academicLevelCode)
      ) {
        counters.inserted += subLevels.length;
        continue;
      }
      seedWarn({
        event: 'SUB_LEVEL_PARENT_MISSING',
        message: 'Skipping sublevels: parent academic level not found',
        metadata: { academicLevelCode, catalogKey },
      });
      counters.skipped += subLevels.length;
      continue;
    }

    for (const subLevel of subLevels) {
      const existing = await ctx.prisma.subLevel.findUnique({
        where: {
          academicLevelId_code: {
            academicLevelId: academicLevel.id,
            code: subLevel.code,
          },
        },
      });

      if (ctx.dryRun) {
        counters[existing ? 'updated' : 'inserted'] += 1;
        continue;
      }

      await ctx.prisma.subLevel.upsert({
        where: {
          academicLevelId_code: {
            academicLevelId: academicLevel.id,
            code: subLevel.code,
          },
        },
        create: {
          ...subLevel,
          academicLevelId: academicLevel.id,
          institutionId: null,
          isSystem: true,
          isActive: true,
        },
        update: {
          name: subLevel.name,
          order: subLevel.order,
          description: subLevel.description,
          isSystem: true,
          isActive: true,
        },
      });
      counters[existing ? 'updated' : 'inserted'] += 1;
      seedLog({
        event: existing ? 'SUB_LEVEL_UPDATED' : 'SUB_LEVEL_INSERTED',
        message: `Sublevel catalog row ${existing ? 'updated' : 'inserted'}`,
        metadata: { academicLevelCode, code: subLevel.code, catalogKey },
      });
    }
  }

  return { step: 'sub-levels', ...counters };
}
