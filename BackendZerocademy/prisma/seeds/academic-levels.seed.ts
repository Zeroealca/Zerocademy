import type { AcademicLevelSeedRow, SeedContext, SeedStepResult } from './types';
import { seedLog } from './seed-logger';
import { emptyCounters } from './seed-summary';

export async function seedAcademicLevels(
  ctx: SeedContext,
  rows: AcademicLevelSeedRow[],
  options?: { catalogKey?: string },
): Promise<SeedStepResult> {
  const counters = emptyCounters();
  const catalogKey = options?.catalogKey ?? 'default';

  for (const row of rows) {
    const existing = await ctx.prisma.academicLevel.findFirst({
      where: { code: row.code, institutionId: null },
    });

    if (ctx.dryRun) {
      seedLog({
        event: existing ? 'ACADEMIC_LEVEL_WOULD_UPDATE' : 'ACADEMIC_LEVEL_WOULD_INSERT',
        message: `Dry run: academic level ${row.code}`,
        metadata: { code: row.code, catalogKey },
      });
      if (existing) {
        counters.updated += 1;
      } else {
        counters.inserted += 1;
      }
      continue;
    }

    if (existing) {
      await ctx.prisma.academicLevel.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          order: row.order,
          description: row.description,
          isSystem: true,
          isActive: true,
        },
      });
      counters.updated += 1;
      seedLog({
        event: 'ACADEMIC_LEVEL_UPDATED',
        message: 'Academic level catalog row updated',
        metadata: { levelId: existing.id, code: row.code, catalogKey },
      });
    } else {
      const created = await ctx.prisma.academicLevel.create({
        data: {
          name: row.name,
          code: row.code,
          order: row.order,
          description: row.description,
          isSystem: true,
          isActive: true,
          institutionId: null,
        },
      });
      counters.inserted += 1;
      seedLog({
        event: 'ACADEMIC_LEVEL_INSERTED',
        message: 'Academic level catalog row inserted',
        metadata: { levelId: created.id, code: row.code, catalogKey },
      });
    }
  }

  return { step: 'academic-levels', ...counters };
}
